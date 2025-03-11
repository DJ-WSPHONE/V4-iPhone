let orders = [];
let skippedOrders = [];
let currentIndex = 0;
let timeoutRef = null;

window.onload = function () {
    document.getElementById("scanner").focus();
};

function uploadPicklist() {
    let fileInput = document.getElementById("picklistUpload");
    let statusText = document.getElementById("uploadStatus");
    let uploadSection = document.getElementById("uploadSection");
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

        // ✅ Hide the upload section after successful upload
        setTimeout(() => {
            uploadSection.style.display = "none";
        }, 2000);
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

    displayOrders();
}

function displayOrders() {
    let ordersTable = document.getElementById("orders");
    ordersTable.innerHTML = "";

    orders.forEach((order, index) => {
        let row = document.createElement("tr");
        row.setAttribute("id", `row-${index}`);
        row.setAttribute("onclick", `undoSpecificSkip(${index})`);
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

function highlightNextIMEI() {
    clearTimeout(timeoutRef);

    orders.forEach((_, index) => {
        let row = document.getElementById(`row-${index}`);

        if (!row.classList.contains("green") && !row.classList.contains("orange")) {
            row.classList.remove("next", "red");
        }
    });

    currentIndex = orders.findIndex(order => 
        !document.getElementById(`row-${orders.indexOf(order)}`).classList.contains("green")
    );

    if (currentIndex === -1) currentIndex = orders.length - 1;

    let activeRow = document.getElementById(`row-${currentIndex}`);
    if (activeRow) activeRow.classList.add("next");
}

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
        moveToNextUnscannedIMEI();
    } else {
        resultRow.classList.add("red");
        setTimeout(() => {
            resultRow.classList.remove("red");
        }, 2000);
    }

    document.getElementById("scanner").value = "";
}

function skipIMEI() {
    let resultRow = document.getElementById(`row-${currentIndex}`);
    if (!resultRow) return;

    resultRow.classList.remove("next");
    resultRow.classList.add("orange");

    if (!skippedOrders.some(entry => entry.index === currentIndex)) {
        skippedOrders.push({ index: currentIndex, order: orders[currentIndex] });
    }

    updateSkippedList();
    moveToNextUnscannedIMEI();
}

function updateSkippedList() {
    let skippedTable = document.getElementById("skipped-orders");
    skippedTable.innerHTML = "";

    let uniqueSkipped = Array.from(new Map(skippedOrders.map(item => [item.order.imei, item])).values());

    uniqueSkipped.forEach((entry) => {
        let newRow = document.createElement("tr");
        newRow.setAttribute("data-index", entry.index);
        newRow.setAttribute("onclick", `undoSpecificSkip(${entry.index})`);
        newRow.innerHTML = `
            <td>${entry.order.order}</td>
            <td>${entry.order.imei}</td>
            <td>${entry.order.model}</td>
            <td>${entry.order.storage}</td>
            <td>${entry.order.color}</td>
            <td>${entry.order.location}</td>
        `;
        skippedTable.appendChild(newRow);
    });
}

function undoSpecificSkip(index) {
    let row = document.getElementById(`row-${index}`);

    if (row.classList.contains("green")) return; // Cannot undo scanned IMEI

    row.classList.remove("orange");
    row.classList.add("next");

    currentIndex = index;
    highlightNextIMEI();

    timeoutRef = setTimeout(() => {
        if (row.classList.contains("next")) {
            row.classList.remove("next");
            row.classList.add("orange");
        }
    }, 5000);
}

function moveToNextUnscannedIMEI() {
    while (currentIndex < orders.length) {
