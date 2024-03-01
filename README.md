# DNS Parser
## Stack: JS, Puppeteer, xml2js

> ### Steps which parser do:
> - get all link lists from https://www.dns-shop.ru/sitemap.xml
> - parsing each xml list page and get an array of links
> - visit each link with interceptions images, css, fonts
> - write data to file

---

### To clone this project to your local machine write into terminal:

```bash
git clone https://github.com/Pau1Bruno/dns-parser.git
```

### To run project:
```bash
node .\parsing-xml.js
```