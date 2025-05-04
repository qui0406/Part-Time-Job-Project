from rest_framework.pagination import PageNumberPagination

class JobPagination(PageNumberPagination):
    page_size =  3

class ApplicationPagination(PageNumberPagination):
    page_size =  5

class NotificationPagination(PageNumberPagination):
    page_size =  5