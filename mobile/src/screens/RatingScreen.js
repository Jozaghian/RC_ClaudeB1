import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AirbnbRating } from 'react-native-ratings';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/apiService';
import { useLoading } from '../contexts/LoadingContext';
import { theme } from '../utils/theme';
import CustomButton from '../components/CustomButton';

export default function RatingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { showLoading, hideLoading } = useLoading();
  
  const { ride, userToRate, userRole } = route.params;
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRating = async () => {
    if (rating < 1) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      setIsSubmitting(true);
      showLoading('Submitting rating...');

      await apiService.post('/ratings/submit', {
        rideId: ride.id,
        ratedUserId: userToRate.id,
        rating,
        comment: comment.trim()
      });

      hideLoading();
      
      Alert.alert(
        'Thank You!',
        'Your rating has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      hideLoading();
      console.error('Error submitting rating:', error);
      
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to submit rating. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (ratingValue) => {
    switch (ratingValue) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Good';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Rate Your Experience</Text>
          <Text style={styles.subtitle}>
            How was your ride with {userToRate.firstName}?
          </Text>
        </View>

        {/* Ride Details */}
        <View style={styles.rideCard}>
          <Text style={styles.rideTitle}>Ride Details</Text>
          <View style={styles.rideRow}>
            <Text style={styles.rideLabel}>Route:</Text>
            <Text style={styles.rideValue}>
              {ride.origin} → {ride.destination}
            </Text>
          </View>
          <View style={styles.rideRow}>
            <Text style={styles.rideLabel}>Date:</Text>
            <Text style={styles.rideValue}>{ride.departureDate}</Text>
          </View>
          <View style={styles.rideRow}>
            <Text style={styles.rideLabel}>
              {userRole === 'driver' ? 'Driver:' : 'Passenger:'}
            </Text>
            <Text style={styles.rideValue}>
              {userToRate.firstName} {userToRate.lastName}
            </Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>Your Rating</Text>
          
          <View style={styles.ratingContainer}>
            <AirbnbRating
              count={5}
              reviews={['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']}
              defaultRating={5}
              size={40}
              selectedColor={theme.colors.primary}
              unSelectedColor={theme.colors.lightGray}
              reviewColor={theme.colors.primary}
              reviewSize={18}
              onFinishRating={setRating}
              starContainerStyle={styles.starContainer}
            />
          </View>

          <Text style={styles.ratingText}>
            {getRatingText(rating)}
          </Text>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.commentTitle}>
            Additional Comments (Optional)
          </Text>
          <Text style={styles.commentSubtitle}>
            Share your experience to help other users
          </Text>
          
          <TextInput
            style={styles.commentInput}
            placeholder="What was great about this ride? Any suggestions for improvement?"
            placeholderTextColor={theme.colors.gray}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          
          <Text style={styles.characterCount}>
            {comment.length}/500 characters
          </Text>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Rating Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>⭐</Text>
              <Text style={styles.tipText}>
                5 stars: Excellent experience, would ride again
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>⭐</Text>
              <Text style={styles.tipText}>
                4 stars: Good experience with minor issues
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>⭐</Text>
              <Text style={styles.tipText}>
                3 stars: Average experience, room for improvement
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>⭐</Text>
              <Text style={styles.tipText}>
                2 stars: Below expectations, significant issues
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>⭐</Text>
              <Text style={styles.tipText}>
                1 star: Poor experience, would not recommend
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Submit Rating"
          onPress={handleSubmitRating}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  rideCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  rideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rideLabel: {
    fontSize: 14,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  rideValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  ratingSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  ratingContainer: {
    marginBottom: 16,
  },
  starContainer: {
    paddingVertical: 10,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  commentSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  commentSubtitle: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 100,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.gray,
    textAlign: 'right',
  },
  tipsSection: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 12,
    padding: 20,
    marginBottom: 100,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.gray,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  submitButton: {
    marginTop: 0,
  },
});