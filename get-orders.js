const {
  default: WooCommerceRestApi,
} = require("@woocommerce/woocommerce-rest-api");
const fs = require("fs");
const { exit } = require("process");

const api = new WooCommerceRestApi({
  url: "https://api.feuerschutz.ch",
  consumerKey: process.argv[2],
  consumerSecret: process.argv[3],
  version: "wc/v3",
});

const SEPERATOR = '"' + "," + '"';
const now = new Date();
const FILENAME = `orders-${now.getDate()}-${
  now.getMonth() + 1
}-${now.getFullYear()}.csv`;
const FILENAME_ORDER_COUNT = ".total-orders";

const HEADERS = [
  "Bestellnummer",
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
];

const generateOrderCsv = (orders) =>
  orders
    .map(
      (o) =>
        '"' +
        [
          o.id,
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
        ].join(SEPERATOR) +
        '"'
    )
    .join("\n");

const generateHeader = () => '"' + HEADERS.join(SEPERATOR) + '"';

const fetchOrders = async () => {
  let offset = 0;
  if (fs.existsSync(`./${FILENAME_ORDER_COUNT}`)) {
    offset = parseInt(fs.readFileSync(`./${FILENAME_ORDER_COUNT}`));
  }

  const firstRun = !fs.existsSync(`./${FILENAME}`);

  if (firstRun) {
    const header = generateHeader();

    fs.writeFileSync(`./${FILENAME}`, header, { encoding: "utf8" });
  }

  let totalOrders = -1;
  let orders = offset;

  while (totalOrders < 0 || orders < totalOrders) {
    const params = {
      per_page: 100,
      offset: orders,
      orderby: "date",
      order: "asc",
    };

    const response = await api.get("orders", params);
    totalOrders = response.headers["x-wp-total"];
    fs.appendFileSync(`./${FILENAME}`, "\n" + generateOrderCsv(response.data), {
      encoding: "utf8",
    });
    orders += response.data.length;

    console.log(
      `Fetched ${orders - offset} new orders of ${
        totalOrders - offset
      } with offset ${offset}`
    );
  }

  fs.writeFileSync(
    `./${FILENAME_ORDER_COUNT}`,
    Math.max(0, totalOrders).toString(),
    {
      encoding: "utf8",
    }
  );
};

fetchOrders();
