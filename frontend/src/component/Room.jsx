import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"

const URL = "http://localhost:3333"

export const Room = ({ name, localAudioTrack, localVideoTrack }) => {
  const [lobby, setLobby] = useState(true)
  const [socket, setSocket] = useState(null)
  const [sendingPc, setSendingPc] = useState(null)
  const [receivingPc, setReceivingPc] = useState(null)
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null)
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null)
  const [remoteMediaStream, setRemoteMediaStream] = useState(null)
  const remoteVideoRef = useRef()
  const localVideoRef = useRef()

  useEffect(() => {
    const socket = io(URL)
    socket.on("send-offer", async ({ roomId }) => {
      console.log("sending offer")
      setLobby(false)
      const pc = new RTCPeerConnection()

      setSendingPc(pc)
      if (localVideoTrack) {
        console.error("added tack")
        console.log(localVideoTrack)
        pc.addTrack(localVideoTrack)
      }
      if (localAudioTrack) {
        console.error("added tack")
        console.log(localAudioTrack)
        pc.addTrack(localAudioTrack)
      }

      pc.onicecandidate = async e => {
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "sender",
            roomId
          })
        }
      }

      pc.onnegotiationneeded = async () => {
        const sdp = await pc.createOffer()
        
        pc.setLocalDescription(sdp)
        socket.emit("offer", {
          sdp,
          roomId
        })
      }
    })

    socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
      setLobby(false)
      const pc = new RTCPeerConnection()
      pc.setRemoteDescription(remoteSdp)
      const sdp = await pc.createAnswer()
      
      pc.setLocalDescription(sdp)
      const stream = new MediaStream()
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
      }

      setRemoteMediaStream(stream)
      setReceivingPc(pc)
      window.pcr = pc

      pc.onicecandidate = async e => {
        if (!e.candidate) {
          return
        }
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "receiver",
            roomId
          })
        }
      }

      socket.emit("answer", {
        roomId,
        sdp: sdp
      })
      setTimeout(() => {
        const track1 = pc.getTransceivers()[0].receiver.track
        const track2 = pc.getTransceivers()[1].receiver.track
        if (track1.kind === "video") {
          setRemoteAudioTrack(track2)
          setRemoteVideoTrack(track1)
        } else {
          setRemoteAudioTrack(track1)
          setRemoteVideoTrack(track2)
        }
        remoteVideoRef.current.srcObject.addTrack(track1)
        remoteVideoRef.current.srcObject.addTrack(track2)
        remoteVideoRef.current.play()
      }, 5000)
    })

    socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
      setLobby(false)
      setSendingPc(pc => {
        pc?.setRemoteDescription(remoteSdp)
        return pc
      })
    })

    socket.on("lobby", () => {
      setLobby(true)
    })

    socket.on("add-ice-candidate", ({ candidate, type }) => {
      if (type == "sender") {
        setReceivingPc(pc => {
          pc?.addIceCandidate(candidate)
          return pc
        })
      } else {
        setSendingPc(pc => {
          pc?.addIceCandidate(candidate)
          return pc
        })
      }
    })

    setSocket(socket)
  }, [name])

  useEffect(() => {
    if (localVideoRef.current) {
      if (localVideoTrack) {
        localVideoRef.current.srcObject = new MediaStream([localVideoTrack])
        localVideoRef.current.play()
      }
    }
  }, [localVideoRef])

  return (
    <div>
      Hi {name}
      <video autoPlay width={400} height={400} ref={localVideoRef} />
      {lobby ? "Waiting to connect you to someone" : null}
      <video autoPlay width={400} height={400} ref={remoteVideoRef} />
    </div>
  )
}
