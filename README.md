# Astral Studio Premium

Studio premium mono-utilisatrice pour agréger des données astrologiques brutes, saisir un portrait individuel ou une analyse de compatibilité, puis produire un rendu PDF éditorial et un rendu mobile vertical.

## Démarrage

```bash
npm install
npm run dev
```

## URLs

- `/`
- `/dashboard`
- `/reports/new`
- `/compatibility/new`

## Déploiement

Prêt pour un déploiement Node classique :
- VPS
- Docker
- Railway avec volume
- Render avec disque persistant

Le stockage est local dans `data/storage/reports.json`.

### Build

```bash
npm run build
npm run start
```

### LAN Windows (reseau local)

1. Lancer le build puis le serveur LAN:

```bash
npm run build
npm run start:lan
```

2. Recuperer l'IP locale Windows:

```powershell
ipconfig
```

Relever l'adresse `IPv4` de la carte reseau active (ex: `192.168.1.42`).

3. Autoriser le port 3000 dans le Pare-feu Windows:
- Ouvrir `Pare-feu Windows Defender avec fonctions avancees`
- Regles de trafic entrant -> Nouvelle regle
- Type `Port` -> `TCP` -> `3000` -> `Autoriser la connexion`
- Appliquer au profil `Prive` (et `Domaine` si besoin)

4. Tester depuis un autre appareil du meme reseau:
- Ouvrir `http://<IP_LOCALE>:3000`
- Exemple: `http://192.168.1.42:3000`

5. Si ca ne repond pas:
- Verifier que le reseau Windows est en profil `Prive`
- Verifier qu'aucun antivirus tiers ne bloque le port
- Verifier que le routeur n'active pas l'isolation client (AP isolation)
- Verifier que l'appareil distant est sur le meme sous-reseau

### Docker

```bash
docker build -t astral-studio-premium .
docker run -p 3000:3000 -v $(pwd)/data/storage:/app/data/storage astral-studio-premium
```

## Stockage Vercel (Postgres)

Le stockage est maintenant hybride:
- sans variable Postgres: stockage fichier local (`data/storage/reports.json`)
- avec `POSTGRES_URL` ou `DATABASE_URL`: stockage Postgres (recommande en deploiement Vercel)

### Variables d'environnement

Configurer au minimum une de ces variables:
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `DATABASE_URL`

### Notes

- La table `reports` est creee automatiquement au premier acces.
- Si Postgres est active sans module `pg`, l'API renvoie une erreur explicite demandant `npm i pg`.
