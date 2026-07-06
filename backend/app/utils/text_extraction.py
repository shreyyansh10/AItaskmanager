import io
import os
import re
import logging
from fastapi import UploadFile
from pypdf import PdfReader
from docx import Document

logger = logging.getLogger(__name__)

class UnsupportedFileTypeError(Exception):
    """Custom exception raised when an unsupported file type is provided."""
    pass

def clean_whitespace(text: str) -> str:
    """Normalize multiple consecutive newlines and clean up line-level padding."""
    # Strip whitespace from each individual line
    lines = [line.strip() for line in text.splitlines()]
    joined = "\n".join(lines)
    # Replace 3 or more consecutive newlines with 2 newlines to preserve paragraphs
    cleaned = re.sub(r'\n{3,}', '\n\n', joined)
    return cleaned.strip()

def extract_text_from_bytes(content: bytes, filename: str) -> str:
    """
    Extract raw text from file bytes according to the file extension.
    
    Supports:
    - .txt (UTF-8 with Latin-1 fallback)
    - .pdf (page-by-page extraction via pypdf)
    - .docx (paragraph extraction via python-docx)
    
    Raises:
        UnsupportedFileTypeError: If the file type is not supported.
        RuntimeError: If parse error occurs.
    """
    ext = os.path.splitext(filename)[1].lower() if filename else ""
    
    try:
        if ext == ".txt":
            try:
                text = content.decode("utf-8")
            except UnicodeDecodeError:
                logger.warning(f"UTF-8 decoding failed for {filename}, falling back to latin-1")
                text = content.decode("latin-1")
            return clean_whitespace(text)
            
        elif ext == ".pdf":
            try:
                pdf_file = io.BytesIO(content)
                reader = PdfReader(pdf_file)
                text_pages = []
                for i, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_pages.append(page_text)
                full_text = "\n".join(text_pages)
                return clean_whitespace(full_text)
            except Exception as e:
                logger.error(f"Error parsing PDF file {filename}: {str(e)}")
                raise RuntimeError(f"Could not parse PDF file structure: {str(e)}")
                
        elif ext == ".docx":
            try:
                docx_file = io.BytesIO(content)
                doc = Document(docx_file)
                paragraphs = [p.text for p in doc.paragraphs]
                full_text = "\n".join(paragraphs)
                return clean_whitespace(full_text)
            except Exception as e:
                logger.error(f"Error parsing Word file {filename}: {str(e)}")
                raise RuntimeError(f"Could not parse Word DOCX file structure: {str(e)}")
                
        else:
            logger.warning(f"Attempted to ingest file with unsupported extension: {ext or 'no extension'}")
            raise UnsupportedFileTypeError(f"Unsupported file type '{ext}'. Supported formats: .txt, .pdf, .docx")
            
    except UnsupportedFileTypeError:
        raise
    except Exception as e:
        logger.error(f"Failed to extract text from {filename} due to internal error: {str(e)}")
        raise RuntimeError(f"Failed to extract text: {str(e)}")

async def extract_text(file: UploadFile) -> str:
    """
    FastAPI adapter that reads the uploaded file's bytes and 
    extracts the raw text content.
    """
    content = await file.read()
    return extract_text_from_bytes(content, file.filename or "")
