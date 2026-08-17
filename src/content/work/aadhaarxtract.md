---
name: AadhaarXtract
order: 4
year: "2025"
role: Solo build
problem: An app that extracts the printed data from a photo of an Aadhaar card, so it can be checked instead of typed.
summary: Reads a photo of an Aadhaar card and pulls the printed fields out as text you can check and correct, instead of transcribing twelve digits by hand. Recognition runs on Tesseract.js.
outcome: "A web app that reads an image of an Aadhaar card and pulls the printed fields out of it, so they can be checked instead of typed. OCR runs in Tesseract.js. React on the front, Express and Node behind it, and no database at all: nothing is stored."
stack:
  # Tesseract.js sits third on purpose — the card shows the first three tags,
  # and the OCR library is the point of this project.
  - React
  - Express
  - Tesseract.js
  - Node
links:
  - label: Source
    url: https://github.com/Akhil-Kumar-2001/AadhaarXtract
published: true
---

## What it does

You upload a photo of an Aadhaar card and it returns the printed details as text
you can verify and correct, rather than transcribing them by hand. Optical
character recognition is handled by Tesseract.js.

## How it's built

React on the front, Express and Node for the API. Tesseract.js handles the
recognition pass. There is no database: the image is read, the text is returned,
and nothing is kept afterwards.

## Why I built it

Everything else I'd built moved records around. I wanted something different
from that, where the work is interpreting a photo rather than storing a form.
