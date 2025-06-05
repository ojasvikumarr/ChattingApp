// frontend/src/lib/peer.js
class PeerService {
  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });

    // Send ICE candidates to the remote peer via signaling
    this.peer.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };
  }

  addTracks(stream) {
    if (!stream || !this.peer) return;
    // Add all tracks without checking for duplicates (simpler & safer)
    stream.getTracks().forEach(track => {
      this.peer.addTrack(track, stream);
    });
  }

  async getOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer() {
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(desc) {
    await this.peer.setRemoteDescription(desc);
  }

  async addIceCandidate(candidate) {
    try {
      await this.peer.addIceCandidate(candidate);
    } catch (err) {
      console.error("Error adding received ICE candidate", err);
    }
  }
}

export default new PeerService();
