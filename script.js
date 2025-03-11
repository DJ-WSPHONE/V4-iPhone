window.onload = function () {
    document.getElementById("scanner").focus();
};

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
