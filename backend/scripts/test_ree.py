import asyncio
from datetime import date
from app.services.ree import ree_client


async def main():
    today = date.today()
    print(f"Pidiendo precios para {today}...\n")

    pvpc = await ree_client.get_pvpc_prices(today)
    spot = await ree_client.get_spot_prices(today)

    print(f"✅ PVPC: {len(pvpc)} precios")
    for p in pvpc[:3]:
        print(f"  {p['datetime_utc']}  →  {p['value_kwh']} €/kWh")

    print(f"\n✅ Spot: {len(spot)} precios")
    for p in spot[:3]:
        print(f"  {p['datetime_utc']}  →  {p['value_kwh']} €/kWh")

    await ree_client.close()


asyncio.run(main())