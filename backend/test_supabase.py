from storage.supabase_storage import (
    upload_generated_file,
)

import asyncio


async def test():

    url = await upload_generated_file(
        "generated_code/test.py"
    )

    print(url)


asyncio.run(test())