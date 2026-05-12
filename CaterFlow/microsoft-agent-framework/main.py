from __future__ import annotations

import argparse
import json
import asyncio
import os

from catering_workflow import run_catering_workflow

def main() -> None:
    parser = argparse.ArgumentParser(description="Run a CaterFlow catering blueprint.")
    parser.add_argument("request", nargs="?", default="Outdoor corporate launch for 180 guests in BGC Taguig, July 18, PHP 280000, Filipino-Spanish, halal, vegetarian, no peanuts.")
    args = parser.parse_args()

    blueprint = asyncio.run(run_catering_workflow(args.request))

    print(json.dumps(blueprint, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
