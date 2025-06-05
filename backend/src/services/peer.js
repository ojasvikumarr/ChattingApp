// lib/peer.js
class PeerService {
  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });
  }

  addTracks(stream) {
    if (!stream || !this.peer) return;
    stream.getTracks().forEach(track => {
      const senders = this.peer.getSenders();
      const alreadyAdded = senders.find(sender => sender.track && sender.track.kind === track.kind);
      if (!alreadyAdded) {
        this.peer.addTrack(track, stream);
      }
    });
  }

  async getOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(offer) {
    await this.peer.setRemoteDescription(offer);
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }
}

export default new PeerService();
