const axios = require('axios').default;
axios.defaults.headers.common['User-Agent'] = "Auto Fullfill System";

let order = require('./test.json');
if (order && order.status == 'successful' && order.result) {
    order = order.result;
    if (order.status == 'return' && order.reason == 'same_color') {
        // console.log(order);
        reportDesign (order);

    }
}

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
