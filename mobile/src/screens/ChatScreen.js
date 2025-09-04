import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../utils/theme';
import { formatTime } from '../utils/helpers';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const { partnerId, partnerName, partnerRating } = route.params;
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Text style={styles.headerName}>{partnerName}</Text>
          {partnerRating && (
            <View style={styles.headerRating}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.headerRatingText}>
                {partnerRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      ),
    });
    
    loadMessages();
  }, [partnerId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/messages/conversation/${partnerId}`);
      setMessages(response.data);
      
      // Scroll to bottom after loading
      setTimeout(() => {
        if (flatListRef.current && response.data.length > 0) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await apiService.post('/messages/send', {
        recipientId: partnerId,
        content: messageText
      });

      // Add the new message to the list
      setMessages(prev => [...prev, response.data]);
      
      // Scroll to bottom
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const moderationError = apiService.handleModerationError(error);
      if (moderationError.isModerationError) {
        Alert.alert(
          'Message Not Allowed',
          'Your message contains inappropriate content and cannot be sent. Please revise and try again.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
      
      // Restore the message text if sending failed
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          
          {item.ride && (
            <View style={styles.rideContext}>
              <Text style={[
                styles.rideContextText,
                isOwnMessage ? styles.ownRideContextText : styles.otherRideContextText
              ]}>
                📍 {item.ride.origin} → {item.ride.destination}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[
          styles.messageTime,
          isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="chatbubble-outline" 
        size={64} 
        color={theme.colors.lightGray} 
      />
      <Text style={styles.emptyTitle}>Start a conversation</Text>
      <Text style={styles.emptySubtitle}>
        Say hello to {partnerName.split(' ')[0]}!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyMessagesList
          ]}
          ListEmptyComponent={!loading && renderEmptyState}
          onContentSizeChange={() => {
            if (flatListRef.current && messages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.gray}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Ionicons 
                name={sending ? "hourglass" : "send"} 
                size={20} 
                color={theme.colors.white} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  headerRatingText: {
    fontSize: 12,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  messagesList: {
    padding: 16,
  },
  emptyMessagesList: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: theme.colors.lightGray,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: theme.colors.white,
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  rideContext: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  rideContextText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  ownRideContextText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherRideContextText: {
    color: theme.colors.gray,
  },
  messageTime: {
    fontSize: 11,
    marginHorizontal: 4,
  },
  ownMessageTime: {
    color: theme.colors.gray,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: theme.colors.gray,
    textAlign: 'left',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    maxHeight: 80,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.gray,
  },
});