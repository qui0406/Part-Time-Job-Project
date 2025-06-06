import requests
import logging
from parttime_job_management import settings

logger = logging.getLogger(__name__)

class IdAnalyzerService:
    API_URL = "https://api.idanalyzer.com"
    API_KEY = settings.ID_ANALYZER_API_KEY

    @staticmethod
    def verify_document(document_front, document_back=None, selfie_image=None):
        if not document_front:
            return {
                'success': False,
                'verified': False,
                'error': 'Thiếu ảnh mặt trước giấy tờ',
            }

        files = {
            'file': (document_front.name, document_front.read(), document_front.content_type)
        }
        
        if document_back:
            files['backfile'] = (document_back.name, document_back.read(), document_back.content_type)
        
        if selfie_image:
            files['biometric_photo'] = (selfie_image.name, selfie_image.read(), selfie_image.content_type)
        payload = {
            'apikey': IdAnalyzerService.API_KEY,
            'outputimage': 'false',
            'face': 'true' if selfie_image else 'false',
            'analyze': 'true',
            'ocr': 'true',
            'returnfaceimage': 'false',
            'returnfulltext': 'true',
            'authenticate': 'true',
            'face_match': 'true',
        }

        try:
            response = requests.post(IdAnalyzerService.API_URL, data=payload, files=files)
            response.raise_for_status()
            return IdAnalyzerService._process_response(response.json())
        
        except requests.RequestException as e:
            return {
                'success': False,
                'verified': False,
                'error': f'Xác minh bên ngoài thất bại: {str(e)}'
            }


    @staticmethod
    def _process_response(result):
        if "error" in result:
            logger.error(f"API error: {result['error']['message']} (code: {result['error']['code']})")
            return {
                'success': False,
                'error': result['error']['message'],
                'error_code': result['error']['code']
            }

        document_data = result.get('result', {})
        matchrate = result.get('matchrate')
        has_selfie = result.get('face') == 'true'

        if has_selfie:
            if matchrate == 0.93:
                logger.warning(f"Fixed matchrate 0.93 detected. ResponseID: {result.get('responseID', 'N/A')}")
                is_verified = bool(document_data.get('documentNumber') and document_data.get('documentType'))
                verification_details = {
                    'matchrate_ignored': 'Fixed at 0.93, using OCR verification',
                    'document_recognized': is_verified,
                    'document_type': document_data.get('documentType', 'Unknown')
                }
            else:
                is_verified = matchrate >= 0.8
                verification_details = {'matchrate': matchrate}
        else:
            if matchrate is not None:
                logger.warning(f"Unexpected matchrate {matchrate} when face=false")
            is_verified = bool(document_data.get('documentNumber') and document_data.get('documentType'))
            verification_details = {
                'document_recognized': is_verified,
                'document_type': document_data.get('documentType', 'Unknown')
            }

        return {
            'success': True,
            'verified': is_verified,
            'details': verification_details,
            'result': result
        }