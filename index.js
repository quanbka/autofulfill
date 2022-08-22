const axios = require('axios').default;
axios.defaults.headers.common['User-Agent'] = "Auto Fullfill System";

var id = 0;
var lastOrder = null;
var orders = {};

async function getFirstOrder() {
    console.log(`Get first order id > ${id}`);
    let url = `https://glob.api.printerval.com/v2/order?filters=id>${id},verifier_id=1,payment_status=paid,status=processing&metri$
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
