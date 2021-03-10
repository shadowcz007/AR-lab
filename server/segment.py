from matplotlib import pyplot as plt
import cv2
import paddlehub as hub
import numpy as np 
import base64

human_seg = hub.Module(name='humanseg_server')

def cv2_to_base64(image):
    data = cv2.imencode('.jpg', image)[1]
    return base64.b64encode(data.tostring()).decode('utf8')

def base64_to_cv2(b64str):
    data = base64.b64decode(b64str.encode('utf8'))
    data = np.fromstring(data, np.uint8)
    data = cv2.imdecode(data, cv2.IMREAD_COLOR)
    return data

def seg(b64str):
    im = base64_to_cv2(b64str)
    res = human_seg.segment(images=[im],visualization=False)
    img = cv2.cvtColor(res[0]['data'],cv2.COLOR_GRAY2RGB)
    return cv2_to_base64(img)