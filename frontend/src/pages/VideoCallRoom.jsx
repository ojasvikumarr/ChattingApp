import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import { useSocket } from "../context/SocketProvider";
import peer from "../lib/peer";

const ROOM_ID = "demo-room";

const VideoCallRoom = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // 1. Join room on mount
  useEffect(() => {
    const email = `user_${Math.floor(Math.random() * 10000)}`;
    socket.emit("room:join", { email, room: ROOM_ID });
  }, [socket]);

  // 2. Listen for new user joined
  useEffect(() => {
    const handleUserJoined = ({ email, id }) => {
      console.log("User joined:", email, id);
      setRemoteSocketId(id);
    };

    socket.on("user:joined", handleUserJoined);
    return () => socket.off("user:joined", handleUserJoined);
  }, [socket]);

  // 3. Listen for incoming calls (offers)
  useEffect(() => {
    const handleIncomingCall = async ({ from, offer }) => {
      console.log("Incoming call from:", from);
      setRemoteSocketId(from);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);

      // Listen for remote tracks
      peer.peer.ontrack = (event) => {
        console.log("Received remote track");
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
      };

      // Add your tracks
      peer.addTracks(stream);

      // Set remote description with the received offer
      await peer.setRemoteDescription(offer);

      // Create and set local answer description
      const answer = await peer.getAnswer();

      // Send answer back to caller
      socket.emit("call:accepted", { to: from, ans: answer });
    };

    socket.on("incoming:call", handleIncomingCall);
    return () => socket.off("incoming:call", handleIncomingCall);
  }, [socket]);

  // 4. Listen for call accepted (answer)
  useEffect(() => {
    const handleCallAccepted = async ({ ans }) => {
      console.log("Call accepted, setting remote description (answer)");
      await peer.setRemoteDescription(ans);
    };

    socket.on("call:accepted", handleCallAccepted);
    return () => socket.off("call:accepted", handleCallAccepted);
  }, []);

  // 5. ICE candidate sending/receiving setup
  useEffect(() => {
    // Send ICE candidates to remote peer via socket
    peer.onIceCandidate = (candidate) => {
      if (remoteSocketId) {
        socket.emit("ice-candidate", { to: remoteSocketId, candidate });
      }
    };

    // Receive ICE candidates from remote peer
    const handleIceCandidate = async ({ candidate }) => {
      console.log("Received ICE candidate:", candidate);
      await peer.addIceCandidate(candidate);
    };

    socket.on("ice-candidate", handleIceCandidate);
    return () => socket.off("ice-candidate", handleIceCandidate);
  }, [socket, remoteSocketId]);

  // 6. Make call to remote peer
  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId) {
      alert("No user to call");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);

    // Listen for remote tracks
    peer.peer.ontrack = (event) => {
      console.log("Received remote track");
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
    };

    // Add local tracks to the peer connection
    peer.addTracks(stream);

    // Create offer and set local description
    const offer = await peer.getOffer();

    // Send offer to remote peer
    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? "✅ Connected to peer" : "⏳ Waiting for peer to join..."}</h4>

      {remoteSocketId && <button onClick={handleCallUser}>📞 CALL</button>}

      {myStream && (
        <>
          <h2>📷 My Video</h2>
          <ReactPlayer
            playing
            muted
            url={myStream}
            width="400px"
            height="300px"
          />
        </>
      )}

      {remoteStream && (
        <>
          <h2>👀 Remote Video</h2>
          <ReactPlayer
            playing
            muted={false}
            url={remoteStream}
            width="400px"
            height="300px"
          />
        </>
      )}
    </div>
  );
};

export default VideoCallRoom;
