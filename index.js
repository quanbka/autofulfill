const axios = require('axios').default;
axios.defaults.headers.common['User-Agent'] = "Auto Fullfill System";

var id = 0;
var lastOrder = null;
var orders = {};

async function getFirstOrder() {
    console.log(`Get first order id > ${id}`);
    let url = `https://glob.api.printerval.com/v2/order?filters=id>${id},verifier_id=1,payment_status=paid,status=processing&metric=first`;
    axios.get(url)
        .then(async function(response) {
            order = response.data.result;
            if (order) {
                id = response.data.result.id;
                console.log(`Auto fulfill order with id ${id}`)
                let apiUrl = `https://us.api.printerval.com/order/auto-fulfill-by-id?id=${id}`
                let apiResponse = await axios.get(apiUrl);
                let data = apiResponse.data;
                lastOrder = data;
                console.log(JSON.stringify(data));
	            orders[id] = data;
                if (data.status == 'successful' && data.result.status != 'pending') {
                    console.log(data);
                }
            } else {
                id = 0;
            }
        })
        .catch(async function(error) {
            id++;
            console.log(error);
        })
        .then(async function() {
            console.log(id);
            if (id !== null) {
                getFirstOrder();
            }
        });
}

(async () => {
    let order = await getFirstOrder()
})();

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send("Printerval Auto fulfill System");
});

app.get('/:id', (req, res) => {
    res.send(orders[req.params.id]);
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`helloworld: listening on port ${port}`);
});




async function reportDesign (order) {
    designJobId = await getDesignJobId (order);
}

async function getDesignJobId (order) {
    let designApiUrl = await getDesignApiUrl(order.data.design);
    // console.log(designApiUrl);
    if (!designApiUrl) return;

    let product = await getProductId(designApiUrl);
    console.log(product);
    if (!product) return;

    let color = await getColor(order, product);
    console.log(color);
    if (!color) return;

    let job = await getJob(product);
    console.log(job);
    if (!job) return;

    await updateMissingColorJob(job, color);

}

async function getDesignApiUrl (design) {
    for (var variable in order.data.design) {
        if (order.data.design.hasOwnProperty(variable)) {
            if (order.data.design[variable].code == 'same_color') {
                return variable;
            }
        }
    }
}

async function getProductId (designApiUrl) {
    matches = designApiUrl.match(/product_sku_id=(\d+)&product_id=(\d+)/);
    if (matches && matches[1]) {
        return {
            product_sku_id : matches[1],
            product_id : matches[2],
        };
    }
}

async function getColor (order, product) {
    return (order.data.template[product.product_sku_id].color);
}

async function getJob (product) {
    let api = `https://central.api.printerval.com/design_job?filters=product_id=${product.product_id}&metric=first`;
    let response = await axios.get(api);
    return response.data.result;
}

async function updateMissingColorJob (order, color) {
    let note = `Không auto ff được, khách đặt màu ${color}`;
    if (order.note) {
        note += ' \n ' + order.note;
    }
    let api = `https://central.api.printerval.com/design_job/${order.id}?service_token=megaads@123`;
    let data = {
        'note' : note,
        'status' : 'waiting'
    }
    let response = await axios.patch(api, data).catch(function (e) {
        console.log(e);
    });
    console.log(response.data);
}
