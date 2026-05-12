import asyncio
import time
import json
import os
from dotenv import load_dotenv
load_dotenv()
from catering_workflow import run_catering_workflow

async def test():
    start = time.time()
    print("Starting Parallel Orchestration Test...")
    result = await run_catering_workflow("Wedding for 100 people in BGC. Budget 150k. Filipino cuisine.")
    end = time.time()
    print(f"\nTotal Time: {end - start:.2f} seconds")
    print(f"Result Preview: {str(result)[:200]}...")

if __name__ == "__main__":
    asyncio.run(test())
