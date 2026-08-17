---
name: RideSense
order: 1
year: "2025 — present"
role: Software engineer
problem: "One place for the entire ride: route planning, group chat, live tracking, ride albums, expense splitting, personalised routes, and offline support."
summary: Everything a motorcyclist does around a ride, in one app. Plan the route, ride as a group with live location, split fuel and food costs, track your own spend, and keep a garage of your bikes.
outcome: I own the backend and infrastructure for RideSense — the API layer, the AWS services behind it, and the deployment pipeline. I also built the web app that renders live rider positions on a Mapbox map, so a ride can be followed from a browser without installing anything.
stack:
  - Node
  - NestJS
  - PostgreSQL
  - DynamoDB
  - AppSync
  - Lambda
  - S3
  - EC2
  - Docker
  - Astro
  - Mapbox
links:
  - label: ridesense.in
    url: https://ridesense.in
  - label: App Store ↓
    url: https://apps.apple.com/in/app/ridesense/id6503331534
    store: true
  - label: Play Store ↓
    url: https://play.google.com/store/apps/details?id=com.ridesense.app
    store: true
published: true
---

## What it is

RideSense is an app for motorcyclists for route planning, group rides, live
location sharing, chat, ride albums, and group expense splitting and settlement.
It's available on both the App Store and Google Play.

## What I own

The backend and the infrastructure it runs on. That includes the API layer, the
data model across Postgres and DynamoDB, AWS services like Lambda, AppSync, S3,
and EC2, along with the CI/CD pipeline and Docker setup used to deploy changes
to production.

## The web app

Live tracking also needs to work for people who aren't on the app. I built the
web side of that, with rider positions rendered on a Mapbox map and followable
from any browser without installing anything. This makes it easy for family and
friends to track the ride.

I built it in Astro. The page is mostly a map, so there was no need to ship a
framework runtime alongside it. The surrounding page is static HTML, and the map
is the only part that needs JavaScript.

## Working on a product rather than a project

This is the part personal projects don't teach. Deployment cycles that other
people depend on, documentation someone else has to read, and a codebase where
the decision you make today is still there in six months. It's changed how I
write things more than any specific technology has.
