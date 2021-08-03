// Color Variable
var color = "#000000";
// Set up the canvas
var canvas = document.getElementById("whiteboard-canvas");
var dpr = window.devicePixelRatio || 1;
var ctx = canvas.getContext("2d");
ctx.canvas.width = window.innerWidth * dpr;
ctx.canvas.height = window.innerHeight * dpr;
ctx.strokeStyle = color;
ctx.lineWidth = 4;

// Get the position of the mouse relative to the canvas
function getMousePos(canvasDom, mouseEvent) {
  var rect = canvasDom.getBoundingClientRect();
  return {
    x: mouseEvent.clientX - rect.left,
    y: mouseEvent.clientY - rect.top,
  };
}

// Get a regular interval for drawing to the screen
window.requestAnimFrame = (function (callback) {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimaitonFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

// Draw to the canvas
function renderCanvas() {
  if (drawing) {
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.stroke();
    lastPos = mousePos;
    ctx.closePath();
  }
}

// Allow for animation
(function drawLoop() {
  requestAnimFrame(drawLoop);
  renderCanvas();
})();

// Color picker stroke color
function changeColor() {
  erasing = false;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  document.getElementById("colorPicker").click();
  document.getElementById("colorPicker").onchange = function () {
    color = this.value;
    console.log("Color changed to: " + color);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
  };
}

// Eraser
function startErasing() {
  color = "#FFFFFF";
  console.log("Erasing.");
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 50;
  erasing = true;
}

// Set up mouse events for drawing
var drawing = false;
var erasing = false;
var x, y;
var mousePos = { x: x, y: y };
var lastPos = mousePos;
canvas.addEventListener(
  "mousedown",
  function (e) {
    drawing = true;
    lastPos = getMousePos(canvas, e);
    canvas.addEventListener(
      "mousemove",
      function (e) {
        mousePos = getMousePos(canvas, e);
      },
      false
    );
  },
  false
);
canvas.addEventListener(
  "mouseup",
  function (e) {
    drawing = false;
  },
  false
);

// Set up touch events for mobile, etc
canvas.addEventListener(
  "touchstart",
  function (e) {
    mousePos = getTouchPos(canvas, e);
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvas.dispatchEvent(mouseEvent);
  },
  false
);
canvas.addEventListener(
  "touchend",
  function (e) {
    var mouseEvent = new MouseEvent("mouseup", {});
    canvas.dispatchEvent(mouseEvent);
  },
  false
);
canvas.addEventListener(
  "touchmove",
  function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvas.dispatchEvent(mouseEvent);
  },
  false
);

// Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
  var rect = canvasDom.getBoundingClientRect();
  return {
    x: touchEvent.touches[0].clientX - rect.left,
    y: touchEvent.touches[0].clientY - rect.top,
  };
}

// Prevent scrolling when touching the canvas
document.body.addEventListener(
  "touchstart",
  function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  },
  false
);
document.body.addEventListener(
  "touchend",
  function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  },
  false
);
document.body.addEventListener(
  "touchmove",
  function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  },
  false
);

var dataUrl = canvas.toDataURL();
// Constants
// const dotenv = require("dotenv");
var agoraAppId = "f89a5d8fee874b44bdd8d9de16925a21";
var isLoggedIn = false;
$("#sendMsgBtn").prop("disabled", true);

// Auto Init MaterializeCSS
M.AutoInit();

// RtmClient
const client = AgoraRTM.createInstance(agoraAppId, {
  enableLogUpload: false,
});

// Form Click Event
$("#joinNow").click(function () {
  var accountName = $("#accountName").val();

  // Login
  client
    .login({
      uid: accountName,
    })
    .then(() => {
      console.log("AgoraRTM client login success. Username: " + accountName);
      isLoggedIn = true;

      // Channel Join
      var channelName = $("#channelNameInput").val();
      if (channelName === " ") {
        alert("Enter some value for the room name");
      } else {
        channel = client.createChannel(channelName);
        document.getElementById("channelNameBox").innerHTML = channelName;
        channel
          .join()
          .then(() => {
            console.log("AgoraRTM client channel join success.");
            $("#joinNow").prop("disabled", true);
            $("#sendMsgBtn").prop("disabled", false);

            // Close Channel Join Modal
            $("#joinChatroom").modal("close");

            canvas.addEventListener("mousedown", function () {
              // Mouse Move
              canvas.addEventListener("mousemove", function () {
                if (drawing == true) {
                  // Mouse Positions
                  var lastPosNow = { x: lastPos.x, y: lastPos.y };
                  var mousePosNow = { x: mousePos.x, y: mousePos.y };
                  // Final Message
                  var finalMsg = {
                    lastPosNow: lastPosNow,
                    mousePosNow: mousePosNow,
                    drawing: drawing,
                    color: color,
                    erasing: erasing,
                  };
                  // console.log(finalMsg);
                  msg = {
                    description: "Coordinates where drawing is taking place.",
                    messageType: "TEXT",
                    rawMessage: undefined,
                    text: JSON.stringify(finalMsg),
                  };
                  channel
                    .sendMessage(msg)
                    .then(() => {
                      console.log(
                        "Your message was: " +
                        JSON.stringify(finalMsg) +
                        " by " +
                        accountName
                      );
                    })
                    .catch((error) => {
                      console.log(
                        "Message wasn't sent due to an error: ",
                        error
                      );
                    });
                }
              });
            });

            // Send Channel Message
            $("#sendMsgBtn").click(function () {
              singleMessage = $("#channelMsg").val();
              if (singleMessage === "") {
                alert(
                  "Can't leave the message field empty! Please type some message"
                );
              } else {
                var today = new Date();
                var date =
                  today.getFullYear() +
                  "-" +
                  (today.getMonth() + 1) +
                  "-" +
                  today.getDate();
                var time =
                  today.getHours() +
                  ":" +
                  today.getMinutes() +
                  ":" +
                  today.getSeconds();
                var dateTime = time;
                channel
                  .sendMessage({
                    text: singleMessage,
                  })
                  .then(() => {
                    console.log("Message sent successfully.");
                    console.log(
                      "Your message was: " +
                      singleMessage +
                      " by " +
                      accountName
                    );
                    $("#messageBox").append(
                      `<p><${dateTime}>  <b style='background-color:#8dd1ff;padding:0.5rem;border-radius:1rem;'>${accountName}:</b> ${singleMessage}</p>`
                    );
                    $("#channelMsg").val("");
                  })
                  .catch((error) => {
                    console.log("Message wasn't sent due to an error: ", error);
                  });
                // Receive Channel Message
                channel.on("ChannelMessage", ({ text }, senderId) => {
                  var today = new Date();
                  var date =
                    today.getFullYear() +
                    "-" +
                    (today.getMonth() + 1) +
                    "-" +
                    today.getDate();
                  var time =
                    today.getHours() +
                    ":" +
                    today.getMinutes() +
                    ":" +
                    today.getSeconds();
                  var dateTime = time;
                  console.log("Message received successfully.");
                  console.log("The message is: " + text + " by " + senderId);
                  console.log(typeof text);
                  if (text.indexOf("{") !== 0) {
                    $("#messageBox").append(
                      `<p ><${dateTime}>  <b style='background-color:white;padding:0.5rem;color:#0285dd;border-radius:1rem;'>${senderId}:</b> ${text}</p>`
                    );
                  }
                });
                // Drawing share
                channel.on("ChannelMessage", ({ text }, senderId) => {
                  console.log("Message received successfully.");
                  console.log("The message is: " + text + " by " + senderId);
                  parsedFinalNow = JSON.parse(text);
                  // Parsed Coordinates
                  // console.log(parsedFinalNow);
                  if (parsedFinalNow.drawing == true) {
                    if (parsedFinalNow.erasing == true) {
                      console.log("Erasing for others.");
                      color = "#FFFFFF";
                      ctx.strokeStyle = "#FFFFFF";
                      ctx.lineWidth = 50;
                      ctx.beginPath();
                      ctx.moveTo(
                        parsedFinalNow.lastPosNow.x,
                        parsedFinalNow.lastPosNow.y
                      );
                      ctx.lineTo(
                        parsedFinalNow.mousePosNow.x,
                        parsedFinalNow.mousePosNow.y
                      );
                      ctx.stroke();
                      parsedFinalNow.lastPosNow = parsedFinalNow.mousePosNow;
                      ctx.closePath();
                    } else {
                      console.log("Drawing for others.");
                      ctx.lineWidth = 4;
                      ctx.strokeStyle = parsedFinalNow.color;
                      ctx.beginPath();
                      ctx.moveTo(
                        parsedFinalNow.lastPosNow.x,
                        parsedFinalNow.lastPosNow.y
                      );
                      ctx.lineTo(
                        parsedFinalNow.mousePosNow.x,
                        parsedFinalNow.mousePosNow.y
                      );
                      ctx.stroke();
                      parsedFinalNow.lastPosNow = parsedFinalNow.mousePosNow;
                      ctx.closePath();
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.log("AgoraRTM client channel join failed: ", error);
          })
          .catch((err) => {
            console.log("AgoraRTM client login failure: ", err);
          });
      }
    });
});

// Show Form on Page Load
$(document).ready(function () {
  $("#joinChatroom").modal();
  $("#joinChatroom").modal("open");
});

// Logout
function leaveChannel() {
  channel.leave();
  client.logout();
  isLoggedIn = false;
  $("#joinNow").prop("disabled", false);
  $("#sendMsgBtn").prop("disabled", true);
  $("#joinChatroom").modal("open");
  console.log("Channel left successfully and user has been logged out.");
}
