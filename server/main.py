from sanic import Sanic
from sanic import response
from sanic.exceptions import NotFound
from sanic_cors import CORS


import segment,project
  
app = Sanic(name=__name__)
CORS(app)
# camera = Camera()

# @app.route('/')
# def handle_request(request):
#     return response.html('<p>Hello world!</p><img src="/camera-stream/">')


@app.route('/face', methods=['POST'])
async def handle_face_count(request):
    # print(request.json)
    json=request.json
    res=0
    if json:
        res=segment.face_count(json['base64'])
    return response.json({'count': res})


@app.route('/segment', methods=['POST'])
async def handle_segment(request):
    # print(request.json)
    json=request.json
    res=''
    if json:
        res=segment.run(json['base64'])
    return response.json({'base64': res})

@app.route('/project', methods=['POST'])
async def handle_project(request):
    json=request.json
    res={"x":'0.5',"y":'0.5'}
    try:
        res=project.run(json['view'])
        res['x']=str(res['x'])
        res['y']=str(res['y'])
    except:
        print("-")
    # sanic的json dumps int有bug，需提前转为str
    return response.json(res)


# @app.route('/depth_estimation')
# async def handle_depth_estimation(request):
#     return await response.file_stream(camera.depth_estimation_file)



# @app.route('/camera-stream/')
# async def camera_stream(request):
#     return response.stream(
#         camera.stream,
#         content_type='multipart/x-mixed-replace; boundary=frame'
#     )





if __name__ == '__main__':
    app.error_handler.add(
        NotFound,
        lambda r, e: response.empty(status=404)
    )
    app.run(host='0.0.0.0', port=8891,workers=1)
    #workers须==1，不然无法运行，原因待查，可能是飞浆hub不支持