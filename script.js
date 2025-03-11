let orders = [];
let skippedOrders = [];
let currentIndex = 0;

// Automatically focus on the scanner input when the page loads
window.onload = function () {
    document.getElementById("scanner").focus();
};

// ✅ CSV Upload Function
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

// ✅ Parse CSV and Populate Orders List
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

        let order = row[orderIndex]?.trim() || "Unknown Order";
        let imei = row[imeiIndex]?.trim() || "";
        let model = row[modelIndex]?.trim() || "Unknown Model";
        let storage = row[storageIndex]?.trim() || "Unknown Storage";
        let color = row[colorIndex]?.trim() || "Unknown Color";
        let location = row[locationIndex]?.trim() || "Unknown Location";

        if (imei) {
            orders.push({ order, imei, model, storage, color, location });
        }
    }

    if (orders.length === 0) {
        alert("Error: No valid IMEIs found in the CSV file.");
        return;
    }

    displayOrders();
}

// ✅ Display Orders in Table
function displayOrders() {
    let ordersTable = document.getElementById("orders");
    ordersTable.innerHTML = "";

    if (orders.length === 0) {
        ordersTable.innerHTML = "<tr><td colspan='6'>No IMEIs loaded.</td></tr>";
        return;
    }

    orders.forEach((order, index) => {
        let row = document.createElement("tr");
        row.setAttribute("id", `row-${index}`);
        row.innerHTML = `
            <td>${order.order}</td>
            <td>${order.imei}</td>
            <td>${order.model}</td>
            <td>${order.storage}</td>
            <td>${order.color}</td>
            <td>${order.location}</td>
        `;
        ordersTable.appendChild(row);
    });

    highlightNextIMEI();
}

// ✅ Highlight Next Pending IMEI
function highlightNextIMEI() {
    orders.forEach((_, index) => {
        let row = document.getElementById(`row-${index}`);

        if (!row.classList.contains("green") && !row.classList.contains("orange")) {
            row.classList.remove("next", "red");
        }
    });

    // ✅ Move to the highest unscanned IMEI
    currentIndex = orders.findIndex(order => 
        !document.getElementById(`row-${orders.indexOf(order)}`).classList.contains("green")
    );

    if (currentIndex === -1) currentIndex = orders.length - 1;

    let activeRow = document.getElementById(`row-${currentIndex}`);
    if (activeRow) activeRow.classList.add("next");
}

// ✅ Handle Scanning an IMEI
function checkIMEI() {
    let scannerInput = document.getElementById("scanner").value.trim();
    let resultRow = document.getElementById(`row-${currentIndex}`);

    if (!resultRow) {
        alert("No more IMEIs left to scan.");
        return;
    }

    if (scannerInput === orders[currentIndex].imei) {
        resultRow.classList.remove("next", "red", "orange");
        resultRow.classList.add("green");
        resultRow.removeAttribute("onclick");

        skippedOrders = skippedOrders.filter(entry => entry.index !== currentIndex);
        updateSkippedList();

        moveToNextUnscannedIMEI
