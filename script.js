let orders = [];
let skippedOrders = [];
let currentIndex = 0;

window.onload = function () {
    document.getElementById("scanner").focus();
};

function uploadPicklist() {
    let fileInput = document.getElementById("picklistUpload");
    let statusText = document.getElementById("uploadStatus");
    let file = fileInput.files[0];

    if (!file) {
        statusText.textContent = "⚠️ No file selected. Please choose a CSV file.";
        return;
    }

    let reader = new FileReader();
    reader.onload = function (event) {
        let csvContent = event.target.result;
        if (!csvContent.trim()) {
            statusText.textContent = "⚠️ File is empty. Please upload a valid CSV.";
            return;
        }
        statusText.textContent = "✅ File uploaded successfully!";
        parseCSV(csvContent);
    };
    reader.onerror = function () {
        statusText.textContent = "⚠️ Error reading the file. Try again.";
    };
    reader.readAsText(file);
}

function parseCSV(csvData) {
    let rows = csvData.trim().split("\n").map(row => row.split(",").map(cell => cell.trim()));
    if (rows.length < 2) {
        alert("Error: CSV file is missing data.");
        return;
    }

    let headers = rows[0].map(header => header.toLowerCase());
    let orderIndex = headers.indexOf("order");
    let imeiIndex = headers.indexOf("esn");
    let modelIndex = headers.indexOf("model");
    let storageIndex = headers.indexOf("capacity");
    let colorIndex = headers.indexOf("color");
    let locationIndex = headers.indexOf("location");

    if (imeiIndex === -1 || orderIndex === -1) {
        alert("Error: The CSV file is missing required headers (Order, ESN).");
        return;
    }

    orders = [];
    skippedOrders = [];

    for (let i = 1; i < rows.length; i++) {
        let row = rows[i];
        if (row.length < headers.length) continue;
        let order = row[orderIndex] || "Unknown Order";
        let imei = row[imeiIndex] || "";
        let model = row[modelIndex] || "Unknown Model";
        let storage = row[storageIndex] || "Unknown Storage";
        let color = row[colorIndex] || "Unknown Color";
        let location = row[locationIndex] || "Unknown Location";

        if (imei) {
            orders.push({ order, imei, model, storage, color, location });
        }
    }
    displayOrders();
}

function displayOrders() {
    let ordersTable = document.getElementById("orders");
    ordersTable.innerHTML = "";
    orders.forEach((order, index) => {
        let row = document.createElement("tr");
        row.id = `row-${index}`;
        row.innerHTML = `<td>${order.order}</td><td>${order.imei}</td><td>${order.model}</td><td>${order.storage}</td><td>${order.color}</td><td>${order.location}</td>`;
        ordersTable.appendChild(row);
    });
    highlightNextIMEI();
}

function highlightNextIMEI() {
    orders.forEach((_, index) => {
        let row = document.getElementById(`row-${index}`);
        if (!row.classList.contains("green") && !row.classList.contains("orange")) {
            row.classList.remove("next", "red");
        }
    });

    if (currentIndex < orders.length) {
        let activeRow = document.getElementById(`row-${currentIndex}`);
        activeRow.classList.add("next");
    }
}

function checkIMEI() {
    let scannerInput = document.getElementById("scanner").value.trim();
    let resultRow = document.getElementById(`row-${currentIndex}`);

    if (!resultRow) return;
    if (scannerInput === orders[currentIndex].imei) {
        resultRow.classList.remove("next", "red", "orange");
        resultRow.classList.add("green");
        resultRow.removeAttribute("onclick");
        moveToNextUnscannedIMEI();
    } else {
        resultRow.classList.add("red");
        setTimeout(() => resultRow.classList.remove("red"), 2000);
    }
    document.getElementById("scanner").value = "";
}
