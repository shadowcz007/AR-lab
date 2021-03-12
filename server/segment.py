import paddlehub as hub
import cv2
import utils

mask_detector = hub.Module(name="pyramidbox_lite_server_mask")
human_seg = hub.Module(name='humanseg_server')


#人脸数量
def face_count(b64str):
    im = utils.base64_to_cv2(b64str)
    cv2.imwrite('face_detection.png',im)
    result = mask_detector.face_detection(images=[im])
    return len(result[0]['data'])

#人像分割
def run(b64str):
    im = utils.base64_to_cv2(b64str)
    cv2.imwrite('human_seg.png',im)
    res = human_seg.segment(images=[im],visualization=False)
    img = utils.gray2rgb(res[0]['data'])
    
    b_channel, g_channel, r_channel = cv2.split(img) 

    alpha_channel = res[0]['data']

    img_BGRA = cv2.merge((b_channel, g_channel, r_channel, alpha_channel)) 

    return utils.cv2_to_base64(img_BGRA)