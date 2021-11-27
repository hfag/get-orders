const {
  default: WooCommerceRestApi,
} = require("@woocommerce/woocommerce-rest-api");
const fs = require("fs");

const api = new WooCommerceRestApi({
  url: "https://api.feuerschutz.ch",
  consumerKey: process.argv[2],
  consumerSecret: process.argv[3],
  version: "wc/v3",
});

const SEPERATOR = '"' + "," + '"';
const FILENAME = "orders.csv";

const HEADERS = [
  "Bestellnummer",
  "Bestelldatum",
  "Total",
  "Total Steuern",
  "Versandkosten",
  "Kunden ID",
  "Notiz",
  "Rechnung Vorname",
  "Rechnung Nachname",
  "Rechnung Firma",
  "Rechnung Adresse 1",
  "Rechnung Adresse 2",
  "Rechnung Postfach",
  "Rechnung Stadt",
  "Rechnung Kanton",
  "Rechnung Postleitzahl",
  "Rechnung Land",
  "Rechnung E-Mail",
  "Rechnung Telefon",
  "Versand Vorname",
  "Versand Nachname",
  "Versand Firma",
  "Versand Adresse 1",
  "Versand Adresse 2",
  "Versand Postfach",
  "Versand Stadt",
  "Versand Kanton",
  "Versand Postleitzahl",
  "Versand Land",
  "Produkt Name",
  "Produkt SKU",
  "Produkt Preis",
  "Produkt Menge",
  "Produkt Subtotal",
];

const generateOrderCsv = (orders) =>
  [].concat
    .apply(
      [],
      orders.map((o) =>
        o.line_items.map(
          (p) =>
            '"' +
            [
              o.id,
              o.date_created,
              o.total,
              o.total_tax,
              o.shipping_total,
              o.customer_id,
              o.customer_note,
              o.billing.first_name,
              o.billing.last_name,
              o.billing.company,
              o.billing.address_1,
              o.billing.address_2,
              o.billing.post_office_box,
              o.billing.city,
              o.billing.state,
              o.billing.postcode,
              o.billing.country,
              o.billing.email,
              o.billing.phone,
              o.shipping.first_name,
              o.shipping.last_name,
              o.shipping.company,
              o.shipping.address_1,
              o.shipping.address_2,
              o.shipping.post_office_box,
              o.shipping.city,
              o.shipping.state,
              o.shipping.postcode,
              o.shipping.country,
              p.name,
              p.sku,
              p.price,
              p.quantity,
              p.subtotal,
            ].join(SEPERATOR) +
            '"'
        )
      )
    )
    .join("\n");

const generateHeader = () => '"' + HEADERS.join(SEPERATOR) + '"';

const fetchOrders = async () => {
  const firstRun = !fs.existsSync(`./${FILENAME}`);
  let lastRun = new Date(0);

  if (firstRun) {
    const header = generateHeader();

    fs.writeFileSync(`./${FILENAME}`, header, { encoding: "utf8" });
  } else {
    const stats = fs.statSync(`./${FILENAME}`);
    lastRun = stats.mtime;
  }

  let totalOrders = 1; //just so we fetch at least once
  let orders = 0;
  let page = 1;
  let maxProducts = 0;

  while (orders < totalOrders) {
    const params = { per_page: 100, page };
    if (!firstRun) {
      params.after = lastRun.toISOString();
    }

    const response = await api.get("orders", params);
    totalOrders = response.headers["x-wp-total"];
    fs.appendFileSync(`./${FILENAME}`, "\n" + generateOrderCsv(response.data), {
      encoding: "utf8",
    });
    orders += response.data.length;
    page++;

    maxProducts = response.data.reduce(
      (max, order) =>
        order.line_items.length > max ? order.line_items.length : max,
      maxProducts
    );

    console.log(
      `Fetched ${orders} orders of ${totalOrders} after ${lastRun.toDateString()}`
    );
  }
};

fetchOrders();
