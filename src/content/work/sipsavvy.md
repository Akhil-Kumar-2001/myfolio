---
name: SipSavvy
order: 3
year: "2024"
role: Solo build
problem: An e-commerce store for buying and selling liquor online, with the whole money side built out.
summary: An online liquor store with the money side built out. Card, cash-on-delivery and wallet payments, coupons, referral cashback, returns and refunds, and an admin panel for catalogue, stock and orders.
outcome: A full storefront and admin panel for liquor retail. Customers pay by card, cash on delivery, or wallet balance, redeem coupons, earn referral cashback, and return orders for refunds. Admins add products, restock, run offers, issue coupons, and follow orders through to refund.
stack:
  - Node
  - Express
  - MongoDB
  - EJS
  - Razorpay
links:
  - label: Source
    url: https://github.com/Akhil-Kumar-2001/Sip-Savvy
published: true
---

## What it does

**Customers** browse and order, pay by card through Razorpay, cash on delivery,
or from a wallet balance. They apply coupons, earn cashback by referring people,
and return orders for a refund.

**Admins** manage the catalogue and restock it, create offers and coupons, and
track orders through the whole lifecycle including returns and refunds.

## How it's built

Server-rendered with EJS on Node and Express, MongoDB underneath, sessions for
auth. No client framework. The pages are mostly forms and lists, and rendering
them on the server was the simpler answer.

## The interesting part

Every one of those features touches money, and they overlap. A refund on an
order that used a coupon isn't the order total. Referral cashback and wallet
balance are the same pot of money arriving by different routes. Getting the
payment, coupon, wallet, and refund logic to agree with each other was most of
the work in this project, and more of it than the storefront itself.
