# TP-airports

API REST y frontend de aeropuertos para Bases de Datos NoSQL. El backend usa MongoDB como almacenamiento principal, Redis GEO para consultas por cercania y Redis ZSET para ranking de popularidad. El frontend muestra los aeropuertos en un mapa Leaflet con clustering de marcadores.

## Servicios

- `mongo`: base de datos principal.
- `redis-geo`: ubicacion de aeropuertos con comandos GEO.
- `redis-pop`: ranking de popularidad con ZSET.
- `backend`: API Express + Mongoose + Redis en `http://localhost:3000`.
- `frontend`: React + Vite + Leaflet en `http://localhost:5173`.

## Levantar el proyecto

```bash
docker compose up --build
```

Al iniciar, el backend carga `backend/data/airports.json` en MongoDB si la coleccion esta vacia. Siempre repuebla Redis GEO con los aeropuertos existentes para que `/airports/nearby` funcione aunque Redis haya arrancado vacio.

## URLs

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## Endpoints

- `POST /airports`: crea un aeropuerto en MongoDB y lo agrega a Redis GEO.
- `GET /airports`: devuelve todos los aeropuertos.
- `GET /airports/:iata`: devuelve un aeropuerto por codigo IATA y suma `+1` en Redis Popularidad.
- `PUT /airports/:iata`: actualiza un aeropuerto y sus coordenadas en Redis GEO.
- `DELETE /airports/:iata`: elimina un aeropuerto de MongoDB, Redis GEO y Redis Popularidad.
- `GET /airports/nearby?lat=..&lng=..&radius=..`: busca aeropuertos cercanos usando Redis GEO.
- `GET /airports/popular`: devuelve el ranking descendente de aeropuertos mas consultados.

## Pruebas rapidas

```bash
curl http://localhost:3000/airports
curl http://localhost:3000/airports/JFK
curl http://localhost:3000/airports/popular
curl "http://localhost:3000/airports/nearby?lat=40.6413&lng=-73.7781&radius=50"
```

Cada click en un marcador del mapa consulta `GET /airports/{iata_faa}` para obtener datos reales del backend. Esa consulta incrementa el ranking de popularidad en Redis con `ZINCRBY` y mantiene la clave `airport_popularity` con expiracion de 24 horas.
