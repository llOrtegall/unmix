"""Dev tool: upload a local file and enqueue a separation job, then follow it.

Stands in for the API until phase 3. Reads the same env vars as the worker.
Usage: uv run --env-file ../../.env scripts/enqueue.py <file> [--model htdemucs_6s]
"""

import argparse
import asyncio
import json
import os
import sys
import time
import uuid
from pathlib import Path

import boto3
from bullmq import Job, Queue

from unmix_worker.contracts import SEPARATION_QUEUE, SEPARATION_REQUESTED_V1
from unmix_worker.contracts.generated import SeparationRequestedV1


async def main() -> None:
    sys.stdout.reconfigure(line_buffering=True)  # progress shows up when piped
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=Path)
    parser.add_argument("--model", default="htdemucs_6s")
    args = parser.parse_args()

    track_id, job_id = str(uuid.uuid4()), str(uuid.uuid4())
    input_key = f"tracks/{track_id}/original{args.file.suffix}"

    s3 = boto3.client(
        "s3",
        endpoint_url=os.environ["S3_ENDPOINT"],
        region_name=os.environ.get("S3_REGION", "us-east-1"),
        aws_access_key_id=os.environ["S3_ACCESS_KEY"],
        aws_secret_access_key=os.environ["S3_SECRET_KEY"],
    )
    s3.upload_file(str(args.file), os.environ["S3_BUCKET"], input_key)
    print(f"uploaded {input_key}")

    message = SeparationRequestedV1(
        messageId=uuid.uuid4(),
        jobId=job_id,
        trackId=track_id,
        inputKey=input_key,
        outputPrefix=f"tracks/{track_id}/stems",
        model=args.model,
    )
    queue = Queue(SEPARATION_QUEUE, {"connection": os.environ["REDIS_URL"]})
    await queue.add(
        SEPARATION_REQUESTED_V1,
        message.model_dump(mode="json"),
        {"jobId": job_id, "attempts": 3, "backoff": {"type": "exponential", "delay": 5000}},
    )
    print(f"enqueued job {job_id}")

    started, last = time.monotonic(), None
    while True:
        job = await Job.fromId(queue, job_id)
        state = await queue.getJobState(job_id)
        snapshot = (state, json.dumps(job.progress), job.attemptsMade)
        if snapshot != last:
            print(f"[{time.monotonic() - started:6.1f}s] state={state} "
                  f"attempts={job.attemptsMade} progress={job.progress}")
            last = snapshot
        if state == "completed":
            print(json.dumps(job.returnvalue, indent=2))
            break
        if state == "failed":
            print(f"failed: {job.failedReason}")
            break
        await asyncio.sleep(1)
    await queue.close()


if __name__ == "__main__":
    asyncio.run(main())
