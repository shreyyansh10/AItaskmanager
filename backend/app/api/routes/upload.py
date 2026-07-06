from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.utils.text_extraction import extract_text, UnsupportedFileTypeError
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["Upload"])

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """
    Temporary route to test file ingestion and text extraction.
    Takes a file, extracts its plain text, and returns the result.
    """
    try:
        text = await extract_text(file)
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "extracted_text": text
        }
    except UnsupportedFileTypeError as e:
        logger.warning(f"File upload rejected due to unsupported type: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Internal error processing file upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while extracting text from file: {str(e)}"
        )
