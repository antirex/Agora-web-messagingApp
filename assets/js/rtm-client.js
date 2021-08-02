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

            // Send Channel Message
            $("#sendMsgBtn").click(function () {
              singleMessage = $("#channelMsg").val();
              if (singleMessage === "") {
                  alert("Can't leave the message field empty! Please type some message")
              } else {
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
                      "<br> <b>Sender:</b> " +
                        accountName +
                        "<br> <b>Message: </b> <span style='white-space: pre-wrap;'>" +
                        singleMessage +
                        "</span><br>"
                    );
                    $("#channelMsg").val("");
                  })
                  .catch((error) => {
                    console.log("Message wasn't sent due to an error: ", error);
                  });

                // Receive Channel Message
                channel.on("ChannelMessage", ({ text }, senderId) => {
                  console.log("Message received successfully.");
                  console.log("The message is: " + text + " by " + senderId);
                  $("#messageBox").append(
                    "<br> <b>Sender:</b> " +
                      senderId +
                      "<br> <b>Message: </b> <span style='white-space: pre-wrap;'>" +
                      text +
                      "</span><br>"
                  );
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
