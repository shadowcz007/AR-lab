import screenpoint
import utils
import cv2

def run(viewBase64):
    
    # Load input images.
    screen = utils.screenshot()

    screen=utils.bgr2gray(screen)
    view = utils.base64_to_cv2(viewBase64)
    view=utils.bgr2gray(view)

    screen=utils.resize(screen)
    view=utils.resize(view)

    h, w = screen.shape[0:2]
    # print(view.shape)
    # Project view centroid to screen space.
    # x and y are the coordinate of the `view` centroid in `screen` space.
    try:
        x, y,im = screenpoint.project(view, screen,True)
        cv2.imwrite('screenpoint.jpg',im)
        return {
            "x":x/w,
            "y":y/h
        }
    except IOError:
        print(IOError)
        return None
    else:
        print('error')
        return None
    


