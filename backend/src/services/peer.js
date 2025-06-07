class PeerService {
  constructor() {
    this.createPeer();
  }

  createPeer() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });
  }

  resetPeer() {
    if (this.peer) {
      this.peer.close();
    }
    this.createPeer();
  }

  addTracks(stream) {
    if (!stream || !this.peer) return;
    stream.getTracks().forEach((track) => {
      const senders = this.peer.getSenders();
      const alreadyAdded = senders.find(
        (sender) => sender.track && sender.track.kind === track.kind
      );
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

  async getAnswer() {
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(desc) {
    await this.peer.setRemoteDescription(desc);
  }

  async addIceCandidate(candidate) {
    await this.peer.addIceCandidate(candidate);
  }
}

export default new PeerService(); 
