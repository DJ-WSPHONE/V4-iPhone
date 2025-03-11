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

function highlightNextIMEI() {
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
