import { Link, useNavigate } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { generateRoomId } from "../lib/genId";
import useAuthUser from "../hooks/useAuthUser";
import { useSocket } from "../context/SocketProvider";

const FriendCard = ({ friend }) => {
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const socket = useSocket(); // get socket from context
  // console.log("AuthUser", authUser);
  // console.log("FriendCard", friend);
  const handleCall = () => {
    const roomId = generateRoomId(authUser._id, friend._id);


    socket.emit("call-user", {
      to: friend._id, // target user ID
      from: authUser._id, // sender
      roomId,
      callerName: authUser.fullName,
    });

    navigate(`/video/room/${roomId}`);
  };
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <img src={friend.profilePic} alt={friend.fullName} />
          </div>
          <h3 className="font-semibold truncate">{friend.fullName}</h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {friend.nativeLanguage}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {friend.learningLanguage}
          </span>
        </div>

        <Link to={`/chat/${friend._id}`} className="btn btn-outline w-full">
          Message
        </Link>
        <button onClick={handleCall} className="btn btn-primary w-full">
          📞 Call
        </button>
      </div>
    </div>
  );
};
export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}
