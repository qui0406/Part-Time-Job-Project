import requests

res = requests.post("http://192.168.1.18:8000/o/token/", data={
    "grant_type": "password",
    "username": "anhqui04062004@gmail.com",
    "password": "12345678",
    "client_id": "axIl2dgEUltKNpQ4rbAqO02TYEqfSVaacyeeL4fn",
    "client_secret": "WPkysTYUkecn6DJijSo6OYiVjTCPwHs6xW0qWSj4dHmE60mCQR4yL11cjWWQymjLN99zO7VdbZ1HHoygncRwiawpCo6DMFRYq96iHrVgDvJ6vNOdAuPCgo8nSdAj7QLX"
})

print(res.status_code)
print(res.json())
