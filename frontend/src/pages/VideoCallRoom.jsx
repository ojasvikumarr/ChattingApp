import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import { useSocket } from "../context/SocketProvider";
import peer from "../lib/peer";
import styled from "styled-components";
import { useNavigate } from "react-router";


const ROOM_ID = "demo-room";

const VideoCallContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
`;

const Status = styled.div`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: ${(props) => (props.connected ? "#d4edda" : "#fff3cd")};
  color: ${(props) => (props.connected ? "#155724" : "#856404")};
`;

const VideoGrid = styled.div`
  display: grid;
  grid-gap: 20px;
  margin-bottom: 20px;
  flex: 1;
  position: relative;
  grid-template-columns: ${(props) => (props.hasRemote ? "1fr 300px" : "1fr")};
  grid-template-areas: ${(props) =>
    props.hasRemote ? '"remote local"' : '"local"'};
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-areas: ${(props) =>
      props.hasRemote ? '"remote" "local"' : '"local"'};
  }
`;

const VideoCard = styled.div`
  position: relative;
  background-color: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  aspect-ratio: 16/9;
  height: ${(props) => (props.remote ? "60vh" : props.small ? "180px" : "auto")};
  align-self: ${(props) => (props.small ? "start" : "auto")};
  @media (max-width: 768px) {
    height: auto;
    width: 100%;
    ${(props) =>
      props.small &&
      `position: absolute; bottom: 20px; right: 20px; width: 120px; z-index: 10;`}
  }
`;

const VideoLabel = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
`;

const NoStream = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #e9ecef;
  border-radius: 12px;
  height: 60vh;
  color: #6c757d;
`;

const PlaceholderIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
`;

const ControlButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background-color: ${(props) =>
    props.end ? "#f8d7da" : props.call ? "#4CAF50" : "#f1f3f5"};
  color: ${(props) =>
    props.end ? "#721c24" : props.call ? "white" : "inherit"};
  font-weight: ${(props) => (props.call ? "bold" : "normal")};
  transition: all 0.2s ease;
  cursor: pointer;
  &:hover {
    background-color: ${(props) =>
      props.end ? "#f5c6cb" : props.call ? "#43A047" : "#e9ecef"};
  }
`;

const ControlIcon = styled.span`
  font-size: 24px;
  margin-bottom: 5px;
`;

const ControlLabel = styled.span`
  font-size: 12px;
`;

const VideoCallRoom = () => {
  const navigate = useNavigate();

  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

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
  }, [socket]);

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

  const handleEndCall = useCallback(() => {
    if (remoteSocketId) {
      socket.emit("call:ended", { to: remoteSocketId });
    }

    // Cleanup local media and remote streams
    myStream?.getTracks().forEach(track => track.stop());
    peer.peer.close();
    peer.resetPeer();

    setMyStream(null);
    setRemoteStream(null);

    // Navigate back to home
    navigate("/");
  }, [remoteSocketId, socket, myStream, navigate]);

  useEffect(() => {
    const handleCallEnded = () => {
      console.log("Call ended by remote");
      myStream?.getTracks().forEach(track => track.stop());
      peer.peer.close();
      peer.resetPeer();
      
      setMyStream(null);
      setRemoteStream(null);
      navigate("/");
    };

    socket.on("call:ended", handleCallEnded);
    return () => socket.off("call:ended", handleCallEnded);
  }, [socket, myStream, navigate]);


  const toggleMute = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <VideoCallContainer>
      <Header>
        <h1>Video Call</h1>
        <Status connected={!!remoteSocketId}>
          {remoteSocketId ? "Connected" : "Waiting for peer..."}
        </Status>
      </Header>
      <VideoGrid hasRemote={!!remoteStream}>
        {remoteStream && (
          <VideoCard remote>
            <ReactPlayer
              playing
              muted={false}
              url={remoteStream}
              width="100%"
              height="100%"
              style={{ objectFit: "cover" }}
            />
            <VideoLabel>Remote User</VideoLabel>
          </VideoCard>
        )}
        {myStream && (
          <VideoCard small={!!remoteStream}>
            <ReactPlayer
              playing
              muted
              url={myStream}
              width="100%"
              height="100%"
              style={{ objectFit: "cover" }}
            />
            <VideoLabel>You</VideoLabel>
          </VideoCard>
        )}
        {!myStream && !remoteStream && (
          <NoStream>
            <PlaceholderIcon>📹</PlaceholderIcon>
            <p>Video will appear here once connected</p>
          </NoStream>
        )}
      </VideoGrid>
      <Controls>
        {remoteSocketId && !remoteStream && (
          <ControlButton call onClick={handleCallUser}>
            <ControlIcon>📞</ControlIcon>
            <ControlLabel>Start Call</ControlLabel>
          </ControlButton>
        )}
        {myStream && (
          <>
            <ControlButton onClick={toggleMute} active={isMuted ? 1 : 0}>
              <ControlIcon>{isMuted ? "🔇" : "🔊"}</ControlIcon>
              <ControlLabel>{isMuted ? "Unmute" : "Mute"}</ControlLabel>
            </ControlButton>
            <ControlButton onClick={toggleVideo} active={isVideoOff ? 1 : 0}>
              <ControlIcon>{isVideoOff ? "📵" : "📹"}</ControlIcon>
              <ControlLabel>
                {isVideoOff ? "Show Video" : "Hide Video"}
              </ControlLabel>
            </ControlButton>
            <ControlButton end onClick={handleEndCall}>
              <ControlIcon>❌</ControlIcon>
              <ControlLabel>End Call</ControlLabel>
            </ControlButton>
          </>
        )}
      </Controls>
    </VideoCallContainer>
  );
};

export default VideoCallRoom;
