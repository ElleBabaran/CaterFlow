from __future__ import annotations
import argparse
import json
import asyncio
import os
import sys

# Add current directory to path to ensure local imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from catering_workflow import run_catering_workflow

async def main() -> None:
    parser = argparse.ArgumentParser(description="Run a CaterFlow catering blueprint with Microsoft AutoGen.")
    parser.add_argument("request", nargs="?", default="Outdoor corporate launch for 50 guests in Makati, Filipino-Spanish, no peanuts.")
    args = parser.parse_args()

    try:
        blueprint = await run_catering_workflow(args.request)
        print(json.dumps(blueprint, indent=2, ensure_ascii=False))
    except Exception as e:
        error_res = {
            "error": str(e),
            "status": "failed",
            "workflow": "Microsoft AutoGen Exception"
        }
        print(json.dumps(error_res))

if __name__ == "__main__":
    asyncio.run(main())
