import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, X } from 'lucide-react';
import { useAudioStore, useSubscriptionStore } from '../store';
import { audioAPI } from '../api';

export default function AudioPlayer() {
  const { audioLibrary, currentAudio, isPlaying, setIsPlaying, setCurrentAudio } = useAudioStore();
  const { currentSubscription } = useSubscriptionStore();
  const [sessionId, setSessionId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState('solfeggio'); // solfeggio or nature

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (sessionId && isPlaying) {
        endSession();
      }
    };
  }, []);

  const startSession = async (audio) => {
    try {
      const res = await audioAPI.startSession(audio.id);
      setSessionId(res.sessionId);
      setCurrentAudio(audio);
      setIsPlaying(true);
      setElapsedTime(0);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      await audioAPI.endSession(sessionId, Math.floor(elapsedTime));
      setSessionId(null);
      setIsPlaying(false);
      setCurrentAudio(null);
      setElapsedTime(0);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      endSession();
    } else if (currentAudio) {
      startSession(currentAudio);
    }
  };

  // Simulate time tracking
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // ALL USERS GET ALL CONTENT - No premium restrictions
  // Handle both old structure (audioLibrary.solfeggio) and new structure (flat array)
  let solfeggios = [];
  let natureSounds = [];

  if (Array.isArray(audioLibrary)) {
    // Backend returns flat array
    solfeggios = audioLibrary.filter(audio => audio.type === 'frequency') || [];
    natureSounds = audioLibrary.filter(audio => audio.type === 'meditation') || [];
  } else if (audioLibrary && typeof audioLibrary === 'object') {
    // If structured with solfeggio and nature properties
    solfeggios = audioLibrary.solfeggio || [];
    natureSounds = audioLibrary.nature || [];
  }

  // All users have access to all content
  const availableSolfeggios = solfeggios;
  const availableNatureSounds = natureSounds;

  const displayedAudios = activeTab === 'solfeggio' ? availableSolfeggios : availableNatureSounds;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🎵 Meditation & Healing Sounds
      </h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('solfeggio')}
          className={`px-6 py-2 font-semibold border-b-2 transition ${
            activeTab === 'solfeggio'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Solfeggio Frequencies {solfeggios.length > 0 && `(${solfeggios.length})`}
        </button>
        <button
          onClick={() => setActiveTab('nature')}
          className={`px-6 py-2 font-semibold border-b-2 transition ${
            activeTab === 'nature'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Nature Sounds {natureSounds.length > 0 && `(${natureSounds.length})`}
        </button>
      </div>

      {/* Current Playing */}
      {currentAudio && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Now Playing
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                {currentAudio.title || currentAudio.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentAudio.description || 'Meditation audio'}
              </p>
            </div>
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {formatTime(elapsedTime)}
              </div>
              <button
                onClick={() => setCurrentAudio(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Play Controls */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
            >
              {isPlaying ? (
                <>
                  <Pause size={20} />
                  Pause
                </>
              ) : (
                <>
                  <Play size={20} />
                  Play
                </>
              )}
            </button>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Volume2 size={20} />
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="70"
                className="w-24"
              />
            </div>
          </div>
        </div>
      )}

      {/* Audio Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {displayedAudios && displayedAudios.length > 0 ? (
          displayedAudios.map((audio) => (
            <div
              key={audio.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                currentAudio?.id === audio.id
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-600 dark:hover:border-purple-600'
              }`}
              onClick={() => {
                if (currentAudio?.id !== audio.id) {
                  setCurrentAudio(audio);
                  if (isPlaying) endSession();
                }
              }}
            >
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                {audio.title || audio.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {audio.description}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startSession(audio);
                }}
                disabled={isPlaying && currentAudio?.id !== audio.id}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <Play size={18} />
                {currentAudio?.id === audio.id ? 'Playing...' : 'Play Now'}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-600 dark:text-gray-400">
            <p>No audio available for this category</p>
          </div>
        )}
      </div>

      {/* All Content Available */}
      {(solfeggios.length > 0 || natureSounds.length > 0) && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 rounded">
          <p className="text-sm text-green-700 dark:text-green-300">
            <strong>✨ Enjoy All Content:</strong> You have access to all {solfeggios.length} Solfeggio frequencies and {natureSounds.length} nature sounds!
          </p>
        </div>
      )}
    </div>
  );
}