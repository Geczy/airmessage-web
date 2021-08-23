import React from "react";

import {Theme, withTheme} from "@material-ui/core/styles";

import styles from "./Messaging.module.css";
import Sidebar from "../master/Sidebar";
import DetailThread from "../thread/DetailThread";
import DetailWelcome from "../detail/DetailWelcome";

import * as ConnectionManager from "../../../connection/connectionManager";
import {ConnectionListener, messageUpdateEmitter, modifierUpdateEmitter} from "../../../connection/connectionManager";
import {initializePeople} from "../../../util/peopleUtils";
import {ConnectionErrorCode, MessageError, ParticipantActionType} from "../../../data/stateCodes";
import {Conversation, ConversationItem, MessageItem, MessageModifier} from "../../../data/blocks";
import SoftDivider from "../../SoftDivider";
import {
	isConversationItemChatRenameAction,
	isConversationItemMessage,
	isConversationItemParticipantAction,
	isModifierTapback,
	messageItemToConversationPreview
} from "../../../util/conversationUtils";
import DetailCreate from "../create/DetailCreate";
import DetailLoading from "../detail/DetailLoading";
import DetailError from "../detail/DetailError";
import SnackbarProvider from "../../control/SnackbarProvider";
import {playSoundMessageIn, playSoundTapback} from "../../../util/soundUtils";
import {getNotificationUtils} from "shared/util/notificationUtils";
import {sortConversationItems} from "shared/util/sortUtils";
import {getPlatformUtils} from "shared/util/platformUtils";

interface Props {
	theme: Theme;
	resetCallback?: VoidFunction | undefined;
}

interface State {
	conversations: Conversation[];
	conversationsAvailable: boolean;
	detailPane: DetailPane;
	sidebarBanner?: ConnectionErrorCode | "connecting";
}

enum DetailType {
	Thread,
	Create,
	Loading,
	Error,
	Welcome,
}

type DetailPane = {
	type: DetailType.Create | DetailType.Loading | DetailType.Welcome;
} | {
	type: DetailType.Thread;
	conversationGUID: string;
} | {
	type: DetailType.Error;
	errorCode: ConnectionErrorCode;
};

interface PendingConversationData {
	latestMessage: MessageItem;
	messageCount: number;
	notificationMessages: MessageItem[];
}

class Messaging extends React.Component<Props, State> {
	private readonly connectionListener: ConnectionListener = {
		onConnecting: () => {
			//Checking if conversations have never been loaded
			if(!this.state.conversationsAvailable) {
				//Displaying the full-screen loading pane
				this.setState({detailPane: {type: DetailType.Loading}});
			} else {
				//Displaying a loading indicator on the sidebar
				this.setState({sidebarBanner: "connecting"});
			}
		},
		onOpen: () => {
			if(!this.state.conversationsAvailable) {
				//Requesting conversation details
				ConnectionManager.fetchConversations().then(data => {
					if(data.length > 0) {
						this.setState({
							conversations: data,
							conversationsAvailable: true,
							detailPane: {type: DetailType.Thread, conversationGUID: data[0].guid}
						});
					} else {
						this.setState({
							conversationsAvailable: true,
							detailPane: {type: DetailType.Welcome}
						});
					}
					
					//Registering for activations
					getPlatformUtils().initializeActivations();
					getPlatformUtils().getChatActivationEmitter()?.registerListener(this.onConversationSelected);
				}).catch((reason: MessageError) => {
					console.error("Failed to fetch conversations", reason);
					ConnectionManager.disconnect();
				});
			} else {
				//Clearing the error from the sidebar
				this.setState({sidebarBanner: undefined});
				
				//Fetching missed messages
				ConnectionManager.requestMissedMessages();
			}
		},
		onClose: (error: ConnectionErrorCode) => {
			//Checking if conversations have never been loaded
			if(!this.state.conversationsAvailable) {
				//Displaying the full-screen error pane
				this.setState({
					detailPane: {type: DetailType.Error, errorCode: error}
				});
			} else {
				//Displaying an error in the sidebar
				this.setState({sidebarBanner: error});
			}
		}
	};
	//Used to hold loose messages received from message updates until their conversation information is received, so it can be applied
	private readonly pendingConversationDataMap: Map<string, PendingConversationData> = new Map();
	
	state: Readonly<State> = {
		conversations: [],
		conversationsAvailable: false,
		detailPane: {type: DetailType.Loading}
	};
	
	render() {
		const sidebarBG = this.props.theme.palette.background.sidebar;
		
		const detailPane = this.state.detailPane;
		
		let masterNode: React.ReactNode;
		switch(detailPane.type) {
			case DetailType.Thread: {
				const conversation: Conversation = this.state.conversations.find(item => item.guid === detailPane.conversationGUID)!;
				masterNode = <DetailThread conversation={conversation} key={conversation.guid}/>;
				break;
			}
			case DetailType.Create:
				masterNode = <DetailCreate onConversationCreated={this.onConversationCreated} />;
				break;
			case DetailType.Loading:
				masterNode = <DetailLoading />;
				break;
			case DetailType.Error:
				masterNode = <DetailError error={detailPane.errorCode} resetCallback={this.props.resetCallback} />;
				break;
			case DetailType.Welcome:
				masterNode = <DetailWelcome />;
				break;
		}
		
		return (
			<SnackbarProvider>
				<div className={styles.split}>
					<div className={styles.splitDetail} style={{backgroundColor: sidebarBG}}>
						<Sidebar
							conversations={this.state.conversationsAvailable ? this.state.conversations : undefined}
							selectedConversation={detailPane.type === DetailType.Thread ? detailPane.conversationGUID : undefined}
							onConversationSelected={this.onConversationSelected}
							onCreateSelected={this.onCreateSelected}
							errorBanner={(typeof this.state.sidebarBanner === "number") ? this.state.sidebarBanner : undefined} />
					</div>
					
					<SoftDivider vertical />
					
					<div className={styles.splitMaster}>{masterNode}</div>
				</div>
			</SnackbarProvider>
		);
	}
	
	private readonly onConversationSelected = (conversationGUID: string): void => {
		this.setState((prevState) => {
			//Finding the existing conversation
			const existingConversationIndex = prevState.conversations.findIndex(conversation => conversation.guid === conversationGUID)!;
			const existingConversation = prevState.conversations[existingConversationIndex];
			if(existingConversation.unreadMessages) {
				//Clear the conversation's unread status
				const pendingConversations: Conversation[] = [...prevState.conversations];
				pendingConversations[existingConversationIndex] = {
					...pendingConversations[existingConversationIndex],
					unreadMessages: false
				};
				
				return {
					conversations: pendingConversations,
					detailPane: {type: DetailType.Thread, conversationGUID: conversationGUID}
				};
			} else {
				//Just select the conversation
				return {
					conversations: prevState.conversations,
					detailPane: {type: DetailType.Thread, conversationGUID: conversationGUID}
				};
			}
		});
	};
	
	private readonly onCreateSelected = (): void => {
		this.setState({detailPane: {type: DetailType.Create}});
	};
	
	private readonly onConversationCreated = (newConversation: Conversation): void => {
		this.setState((prevState) => {
			//Checking if a conversation with a matching GUID already exists
			const matchingConversation = prevState.conversations.find(conversation => conversation.guid === newConversation.guid);
			return {
				detailPane: {
					type: DetailType.Thread,
					conversationGUID: newConversation.guid
				},
				conversations: matchingConversation ? prevState.conversations : [newConversation].concat(prevState.conversations)
			};
		});
	};
	
	componentDidMount() {
		//Subscribing to message updates
		messageUpdateEmitter.registerListener(this.onMessageUpdate);
		
		//Registering the connection listener
		ConnectionManager.addConnectionListener(this.connectionListener);
		modifierUpdateEmitter.registerListener(this.onModifierUpdate);
		
		//Registering the notification selection listener
		getNotificationUtils().getActionEmitter().registerListener(this.onConversationSelected);
		
		//Connecting
		if(ConnectionManager.isDisconnected()) {
			ConnectionManager.connect();
		} else {
			if(ConnectionManager.isConnected()) {
				this.connectionListener.onOpen();
			} else {
				this.connectionListener.onConnecting();
			}
		}
		
		//Loading people
		initializePeople();
		
		//Initializing notifications
		getNotificationUtils().initialize();
	}
	
	componentWillUnmount() {
		//Unregistering the connection listener
		ConnectionManager.removeConnectionListener(this.connectionListener);
		
		//Unsubscribing from message updates
		messageUpdateEmitter.unregisterListener(this.onMessageUpdate);
		modifierUpdateEmitter.unregisterListener(this.onModifierUpdate);
		
		//Unregistering the notification selection listener
		getNotificationUtils().getActionEmitter().unregisterListener(this.onConversationSelected);
		getPlatformUtils().getChatActivationEmitter()?.unregisterListener(this.onConversationSelected);
		
		//Disconnecting
		ConnectionManager.disconnect();
	}
	
	private readonly onMessageUpdate = (itemArray: ConversationItem[]): void => {
		//Keeps track of a single most recent message, along with the number of messages related (including the most recent message)
		type MessageCounter = {message: MessageItem, count: number};
		
		//Accumulator function that reduces an array of messages to MessageCounter instances
		function accumulateMessageItem(accumulator: {[chatGUID: string]: MessageCounter}, item: MessageItem) {
			if(accumulator[item.chatGuid]) {
				const accumulatorItem = accumulator[item.chatGuid];
				
				if(item.date > accumulatorItem.message.date) accumulatorItem.message = item;
				accumulatorItem.count++;
			} else {
				accumulator[item.chatGuid] = {message: item, count: 1};
			}
			
			return accumulator;
		}
		
		//Getting the currently selected conversation ID
		const selectedConversationGUID = this.state.detailPane.type === DetailType.Thread ?
			this.state.detailPane.conversationGUID : undefined;
		
		//Finding the most recent item per chat
		const topItems = itemArray.reduce((accumulator: {[chatGUID: string]: MessageCounter}, item: ConversationItem) => {
			//If the new item isn't a message, ignore it
			if(isConversationItemMessage(item)) {
				accumulateMessageItem(accumulator, item);
			}
			
			return accumulator;
		}, {});
		
		//Whether a message is received in the currently selected conversation
		let activeConversationUpdated = false;
		
		//Sorting messages into their chats for notifications
		const notificationMessages = itemArray.reduce((accumulator: {[chatGUID: string]: MessageItem[]}, item: ConversationItem) => {
			//If the new item isn't an incoming message, ignore it
			if(isConversationItemMessage(item) && item.sender !== undefined) {
				if(item.chatGuid === selectedConversationGUID) {
					//Don't display a desktop notification if the message's conversation is selected
					activeConversationUpdated = true;
				} else {
					//Getting the message array for the message's conversation
					let messageArray: MessageItem[] | undefined = accumulator[item.chatGuid];
					if(messageArray === undefined) {
						messageArray = [];
						accumulator[item.chatGuid] = messageArray;
					}
					
					//Adding the item to the array
					messageArray.push(item);
					messageArray.sort(sortConversationItems);
				}
			}
			
			return accumulator;
		}, {});
		
		//Finding all chat GUIDs that we don't have indexed
		const unlinkedTopItems = Object.entries(topItems).reduce((accumulator: {[chatGUID: string]: MessageCounter}, [chatGUID, entry]) => {
			if(!this.state.conversations.find((conversation) => conversation.guid === chatGUID)) {
				accumulator[chatGUID] = entry;
			}
			return accumulator;
		}, {});

		if(Object.keys(unlinkedTopItems).length > 0) {
			//Saving the items for later reference when we have conversation information
			for(const [chatGUID, {message: latestMessage, count: messageCount}] of Object.entries(unlinkedTopItems)) {
				//Getting the notification messages
				const chatNotificationMessages = notificationMessages[chatGUID] ?? [];
				
				const existingValue = this.pendingConversationDataMap.get(chatGUID);
				if(existingValue !== undefined) {
					//Updating the latest message
					if(existingValue.latestMessage.date < latestMessage.date) {
						existingValue.latestMessage = latestMessage;
					}
					
					//Updating the message count
					existingValue.messageCount += messageCount;
					
					//Updating the notification messages
					if(chatNotificationMessages.length > 0) {
						existingValue.notificationMessages.push(...chatNotificationMessages);
						existingValue.notificationMessages.sort(sortConversationItems);
					}
				} else {
					this.pendingConversationDataMap.set(chatGUID, {
						latestMessage: latestMessage,
						messageCount: messageCount,
						notificationMessages: chatNotificationMessages
					});
				}
			}
			
			//Requesting information for new chats
			ConnectionManager.fetchConversationInfo(Object.keys(unlinkedTopItems))
				.then((result) => {
					const newConversationArray: Conversation[] = [];
					
					//Filter out failed conversations and map to conversation map
					for(const [chatGUID, conversation] of result) {
						
						//Checking if the conversation request failed
						if(!conversation) {
							//Ignoring this conversation and removing its associated preview
							this.pendingConversationDataMap.delete(chatGUID);
							continue;
						}
						
						//Finding and the associated message data
						if(this.pendingConversationDataMap.has(chatGUID)) {
							const data = this.pendingConversationDataMap.get(chatGUID)!;
							this.pendingConversationDataMap.delete(chatGUID);
							
							//Applying the data to the conversation
							conversation.preview = messageItemToConversationPreview(data.latestMessage);
							if(data.notificationMessages.length > 0) conversation.unreadMessages = true;
							
							//Sending a notification
							if(data.notificationMessages.length > 0) {
								getPlatformUtils().hasFocus().then((hasFocus) => {
									if(!hasFocus) {
										getNotificationUtils().showNotifications(conversation, data.notificationMessages);
									}
								});
							}
						}
						
						//Adding the conversation to the array
						newConversationArray.push(conversation);
					}
					
					if(newConversationArray.length > 0) {
						//Adding the new conversations
						this.setState((prevState) => {
							//Cloning the conversation array
							const pendingConversationArray: Conversation[] = [...prevState.conversations];
							
							for(const newConversation of newConversationArray) {
								//Skipping conversations that already exist
								if(pendingConversationArray.find((conversation) => conversation.guid === newConversation.guid)) continue;
								
								//Sorting the conversation into the list
								let olderConversationIndex = pendingConversationArray.findIndex(conversation => conversation.preview.date < newConversation.preview.date);
								if(olderConversationIndex === -1) olderConversationIndex = pendingConversationArray.length;
								
								pendingConversationArray.splice(olderConversationIndex, 0, newConversation);
							}
							
							return {conversations: pendingConversationArray};
						});
					}
				});
		}
		
		//Updating conversations
		this.setState((prevState) => {
			//Cloning the conversation array
			const pendingConversationArray: Conversation[] = [...prevState.conversations];
			
			//Updating the conversation previews
			for(const [chatGUID, {message}] of Object.entries(topItems)) {
				const matchedConversationIndex = pendingConversationArray.findIndex((conversation) => conversation.guid === chatGUID);
				if(matchedConversationIndex === -1) continue;
				
				//Creating the updated conversation
				const updatedConversation: Conversation = {
					...pendingConversationArray[matchedConversationIndex],
					preview: messageItemToConversationPreview(message)
				};
				if(!(prevState.detailPane.type === DetailType.Thread && prevState.detailPane.conversationGUID === chatGUID) && message.sender) updatedConversation.unreadMessages = true;
				
				//Re-sorting the conversation into the list
				pendingConversationArray.splice(matchedConversationIndex, 1);
				let olderConversationIndex = pendingConversationArray.findIndex(conversation => conversation.preview.date < message.date);
				if(olderConversationIndex === -1) olderConversationIndex = pendingConversationArray.length;
				pendingConversationArray.splice(olderConversationIndex, 0, updatedConversation);
			}
			
			//Applying actionable items
			for(const conversationItem of itemArray) {
				if(isConversationItemParticipantAction(conversationItem)) {
					//Ignoring if the chat doesn't exist
					const matchedConversationIndex = pendingConversationArray.findIndex((conversation) => conversation.guid === conversationItem.chatGuid);
					if(matchedConversationIndex === -1) continue;
					
					//If we're the target, we can ignore this as we don't show up in our own copy of the member list
					if(!conversationItem.target) continue;
					
					//Updating the conversation members
					if(conversationItem.type === ParticipantActionType.Join) {
						pendingConversationArray[matchedConversationIndex] = {
							...pendingConversationArray[matchedConversationIndex],
							members: pendingConversationArray[matchedConversationIndex].members.concat(conversationItem.target)
						};
					} else if(conversationItem.type === ParticipantActionType.Leave) {
						pendingConversationArray[matchedConversationIndex] = {
							...pendingConversationArray[matchedConversationIndex],
							members: pendingConversationArray[matchedConversationIndex].members.filter((member) => member !== conversationItem.target)
						};
					}
				} else if(isConversationItemChatRenameAction(conversationItem)) {
					//Ignoring if the chat doesn't exist
					const matchedConversationIndex = pendingConversationArray.findIndex((conversation) => conversation.guid === conversationItem.chatGuid);
					if(matchedConversationIndex === -1) continue;
					
					//Renaming the conversation
					pendingConversationArray[matchedConversationIndex] = {
						...pendingConversationArray[matchedConversationIndex],
						name: conversationItem.chatName
					};
				}
			}
			
			return {
				conversations: pendingConversationArray
			};
		});
		
		{
			const entries = Object.entries(notificationMessages);
			if(entries.length > 0) {
				//Only show notifications if the window isn't focused
				getPlatformUtils().hasFocus().then((hasFocus) => {
					if(!hasFocus) {
						for(const [chatGUID, messages] of entries) {
							//Finding the chat
							const conversation = this.state.conversations.find((conversation) => conversation.guid === chatGUID);
							if(!conversation) continue;
							
							//Sending a notification
							getNotificationUtils().showNotifications(conversation, messages);
						}
					}
				});
			} else {
				if(activeConversationUpdated) playSoundMessageIn();
			}
		}
	};
	
	private readonly onModifierUpdate = (itemArray: MessageModifier[]): void => {
		//Playing a tapback sound
		if(itemArray.some((modifier) => isModifierTapback(modifier) && modifier.isAddition)) {
			playSoundTapback();
		}
	};
}

export default withTheme(Messaging);