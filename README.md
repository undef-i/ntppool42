# Project NTP Pool 42

Welcome to **Project NTP Pool 42**, a voluntary network of Stratum time servers providing highly accurate and reliable Network Time Protocol (NTP) services for the **dn42** internet.

The goal of this project is to offer decentralized, localized, low-latency, and resilient time synchronization across the entire dn42 ecosystem.

## 🌐 Public Server Pools

To ensure optimal latency, please use choose anycast or the specific zone closest to your infrastructure:

| Zone / Type | Domain Name |
| --- | --- |
| **All** | `pool.ntp.dn42` |
| **Anycast** | `anycast.pool.ntp.dn42` |
| **Asia** | `asia.pool.ntp.dn42` |
| **Europe** | `euro.pool.ntp.dn42` |
| **Americas** | `amer.pool.ntp.dn42` |
| **Oceania** | `ocea.pool.ntp.dn42` |
| **Antarctica** | `anta.pool.ntp.dn42` |

## 🏗️ How to Contribute

We welcome any dn42 participant to help strengthen the network infrastructure. You can contribute by hosting an **NTP Server**, a **Name Server (DNS)**, or both.

### NTP Server Requirements

To maintain pool reliability, your NTP server must meet the following criteria:

* **Stratum Level:** Stratum 1 (S1), Stratum 2 (S2), or Stratum 3 (S3) are highly recommended. The absolute minimum allowed is **Stratum 4 (S4)**.
* **Upstream Configuration:** Your server **must not** use `pool.ntp.dn42` as an upstream source (to prevent synchronization loops). But using iana NTP pools like `pool.ntp.org` as upstream is acceptable.
* **Network Connectivity:** UDP port `123` must be open and reachable from within dn42.
* **Access Control List (ACL):** Your NTP daemon must allow queries from the following dn42 IP ranges:
  * `172.20.0.0/14`
  * `172.31.0.0/16`
  * `10.0.0.0/8`
  * `fd00::/8`

### Name Server Hosting (DNS)

The authoritative name server application for this project is built using Node.js. If you wish to host a name server node, you must comply with the following operational rules:

* **Data Synchronization:** You **must** set up an automated task (e.g., via a cron job) to regularly synchronize data from the official repository and restart the server process. This synchronization must occur **at least once a day** to ensure record updates propagate properly.
* **Deployment:**
The server requires minimal setup. Simply clone the repository, install the dependencies, and start the daemon:
```bash
npm i
node src/index.js :: 53
```

## 📂 Source & Administration

The project configuration, source code, and monitoring scripts are currently managed on GitHub. Licensed under AGPLv3.

* **Repository:** [github.com:SessionHu/ntppool42](https://github.com/SessionHu/ntppool42)

If you wish to add, update, or remove your server from the pool, please submit a Pull Request or open an Issue in the repository.

This project is still in the early stage and most things are working in progress. Welcome to contact us in dn42 Telegram or Matrix group.

---

*Project NTP Pool 42 is a community-driven project. Thank you for helping keep dn42 in sync!*
