import paddlehub as hub
import cv2
import utils

human_seg = hub.Module(name='humanseg_server')

def run(b64str):
    im = utils.base64_to_cv2(b64str)
    cv2.imwrite('photo.png',im)
    res = human_seg.segment(images=[im],visualization=False)
    img = utils.gray2rgb(res[0]['data'])
    
    b_channel, g_channel, r_channel = cv2.split(img) 

    alpha_channel = res[0]['data']

    img_BGRA = cv2.merge((b_channel, g_channel, r_channel, alpha_channel)) 

    return utils.cv2_to_base64(img_BGRA)