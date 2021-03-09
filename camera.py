import asyncio
import cv2
import paddlehub as hub
import numpy as np 
# 模型加载
# use_gpu：是否使用GPU进行预测
model = hub.Module(name='MiDaS_Small', use_gpu=False)

# 模型预测
def predict(images):
    return model.depth_estimation(images=images)

def get_depth_map(depth, bits=1):
    depth_min = depth.min()
    depth_max = depth.max()

    max_val = (2**(8 * bits)) - 1

    if depth_max - depth_min > np.finfo("float").eps:
        out = max_val * (depth - depth_min) / (depth_max - depth_min)
    else:
        out = np.zeros(depth.shape, dtype=depth.type)
    if bits == 1:
        return out.astype("uint8")
    elif bits == 2:
        return out.astype("uint16")

def run(im):
    height, width = im.shape[:2]
    # 缩小图像  
    size = (int(width*0.3), int(height*0.5))  
    shrink = cv2.resize(im, size, interpolation=cv2.INTER_AREA) 

    img=predict([shrink])[0]
    img=get_depth_map(img)
    img = cv2.cvtColor(img,cv2.COLOR_GRAY2RGB)

    # 放大图像  
    size = (width, height)  
    img = cv2.resize(img, size, interpolation=cv2.INTER_AREA) 

    return img
  


class Camera():
    """Using Camera as stream"""

    def __init__(self):
        self.video_source = 0
        self.depth_estimation=[]
        self.depth_estimation_file='depth_estimation.jpg'

    async def frames(self):
        camera = cv2.VideoCapture(self.video_source)
        if not camera.isOpened():
            raise RuntimeError('Could not start camera.')

        while True:
            _, img = camera.read()
            
            if len(self.depth_estimation)<5:
                dp=run(img)
                self.depth_estimation.append(dp)
                cv2.imwrite(self.depth_estimation_file,dp)

            yield cv2.imencode('.jpg', img)[1].tobytes()
            await asyncio.sleep(1/120)

    async def stream(self, rsp):
        async for frame in self.frames():
            # frame=run(frame)
            await rsp.write(
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n'
            )

