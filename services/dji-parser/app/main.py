import os
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any

from .parsers.registry import default_registry
from .models import FileInspection, ParseResult, ParserCapabilities

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("dji-parser-service")

app = FastAPI(
    title="DJI Flight Log Parser Service",
    description="Internal microservice for inspecting and decoding DJI binary flight logs, DAT files, and metadata.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVER_DJI_API_KEY = os.getenv("DJI_API_KEY", "")

@app.get("/health")
def health_check():
    parsers = default_registry.get_all_parsers()
    return {
        "status": "healthy",
        "service": "dji-parser-service",
        "active_parsers": [p.name for p in parsers],
        "has_dji_api_key": bool(SERVER_DJI_API_KEY.strip())
    }

@app.get("/supported-formats")
def supported_formats():
    results = []
    for parser in default_registry.get_all_parsers():
        results.append({
            "parser_name": parser.name,
            "parser_version": parser.version,
            "capabilities": parser.get_capabilities().model_dump()
        })
    return {"supported_formats": results}

@app.post("/inspect", response_model=FileInspection)
async def inspect_file(
    file: UploadFile = File(...)
):
    try:
        content = await file.read()
        filename = file.filename or "unknown"
        parser = default_registry.find_parser(content, filename)
        
        if not parser:
            return FileInspection(
                file_type="UNKNOWN",
                capabilities=ParserCapabilities(),
                notes=f"No matching parser found for file: {filename}"
            )
            
        return parser.inspect(content, filename)
    except Exception as e:
        logger.exception(f"Error inspecting file {file.filename}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse", response_model=ParseResult)
async def parse_file(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None)
):
    try:
        content = await file.read()
        filename = file.filename or "unknown"
        effective_key = api_key or SERVER_DJI_API_KEY or None
        
        parser = default_registry.find_parser(content, filename)
        if not parser:
            return ParseResult(
                parser_name="None",
                parser_version="0.0.0",
                status="UNSUPPORTED",
                status_reason=f"No parser available for {filename}",
                inspection=FileInspection(
                    file_type="UNKNOWN",
                    capabilities=ParserCapabilities()
                ),
                summary={},
                telemetry=[],
                events=[]
            )
            
        return parser.parse(content, filename, api_key=effective_key)
    except Exception as e:
        logger.exception(f"Error parsing file {file.filename}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reprocess")
async def reprocess_file(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None)
):
    return await parse_file(file=file, api_key=api_key)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
