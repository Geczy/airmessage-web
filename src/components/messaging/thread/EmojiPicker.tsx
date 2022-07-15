import Picker, { IEmojiData } from "emoji-picker-react";
import React from "react";

const EmojiPicker = (props: {
  onEmojiClick: (event: React.MouseEvent, data: IEmojiData) => void;
}) => {
  return (
    <Picker
      pickerStyle={{ position: "absolute", bottom: "79px", right: "58px" }}
      onEmojiClick={props.onEmojiClick}
    />
  );
};

export default EmojiPicker;
