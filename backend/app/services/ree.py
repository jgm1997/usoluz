from datetime import date
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://apidatos.ree.es"
ENDPOINTS = {
    "pvpc": "/es/datos/mercados/precios-mercados-tiempo-real",
    "spot": "/es/datos/mercados/precios-mercados-tiempo-real",
}
MARKET_TYPES = {"PVPC": "pvpc", "Mercado Spot Diario": "spot"}


class ReeClient:
    def __init__(self):
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=BASE_URL, headers={"Accept": "application/json"}, timeout=30.0
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _get_prices(self, target_date: date) -> list[dict[str, Any]]:
        client = await self._get_client()
        params = {
            "start_date": f"{target_date.strftime('%Y-%m-%d')}T00:00",
            "end_date": f"{target_date.strftime('%Y-%m-%d')}T23:59",
            "time_trunc": "hour",
            "geo_trunc": "electric_system",
            "geo_limit": "peninsular",
            "geo_ids": "8741",
        }

        try:
            response = await client.get(ENDPOINTS["pvpc"], params=params)
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"REE API error {e.response.status_code}: {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"REE connection error: {e}")
            raise

        return response.json().get("included", [])

    def _parse_values(
        self, raw_data: list[dict], market_type: str, provider_key: str
    ) -> list[dict[str, Any]]:
        result = []

        for item in raw_data:
            if item.get("type") != market_type:
                continue

            values = item.get("attributes", {}).get("values", [])
            for v in values:
                value_mwh = round(float(v["value"]), 4)
                value_kwh = round(value_mwh / 1000, 6)

                result.append(
                    {
                        "datetime_utc": v["datetime"],
                        "value_mwh": value_mwh,
                        "value_kwh": value_kwh,
                        "provider": provider_key,
                    }
                )
        result.sort(key=lambda x: x["datetime_utc"])
        return result

    async def get_pvpc_prices(self, target_date: date) -> list[dict[str, Any]]:
        raw = await self._get_prices(target_date)
        prices = self._parse_values(raw, "PVPC", "ree_pvpc")
        if not prices:
            logger.warning(f"No PVPC data for {target_date}")
        return prices

    async def get_spot_prices(self, target_date: date) -> list[dict[str, Any]]:
        """Precios del mercado spot (OMIE) de un día concreto."""
        raw = await self._get_prices(target_date)
        prices = self._parse_values(raw, "Mercado Spot Diario", "ree_spot")

        if not prices:
            logger.warning(f"No spot data for {target_date}")

        return prices

    async def get_all_prices(self, target_date: date) -> list[dict[str, Any]]:
        """Devuelve PVPC + Spot juntos en una sola llamada HTTP."""
        raw = await self._get_prices(target_date)
        return self._parse_values(raw, "PVPC", "ree_pvpc") + self._parse_values(
            raw, "Mercado Spot Diario", "ree_spot"
        )


ree_client = ReeClient()
