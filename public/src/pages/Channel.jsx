import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getUserChannelsRoute, createChannelRoute } from '../utils/APIRoutes';
import styled from "styled-components";

const Channel = () => {
    const [channels, setChannels] = useState([]);
    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
                navigate("/login");
            } else {
                setCurrentUser(
                    await JSON.parse(
                        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
                    )
                );
            }
        };
        fetchCurrentUser();
    }, []);

    const fetchChannels = async () => {
        try {
            if (currentUser) {
                const response = await axios.get(`${getUserChannelsRoute}/${currentUser._id}`);
                setChannels(response.data.channels || []);
                setError(null);
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
            setError('Failed to fetch channels.');
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchChannels();
        }
    }, [currentUser]);

    const handleCreateChannelClick = () => {
        setIsCreatingChannel(true);
    };

    const handleNewChannelNameChange = (event) => {
        setNewChannelName(event.target.value);
    };

    const handleCreateChannelSubmit = async () => {
        if (!newChannelName.trim()) {
            setError('Channel name cannot be empty.');
            return;
        }

        try {
            const response = await axios.post(createChannelRoute, {
                name: newChannelName,
                creator: currentUser._id
            });

            // Thêm kênh mới vào danh sách ngay lập tức
            setChannels(prevChannels => [...prevChannels, response.data.channel]);

            setIsCreatingChannel(false);
            setNewChannelName('');
            setError(null);
        } catch (error) {
            console.error('Error creating channel:', error);
            setError('Failed to create channel.');
        }
    };

    const handleChannelClick = (channelId) => {
        navigate(`/channel/${channelId}`);
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <Container>
            <div className="channel-header">
                <button className="back-button" onClick={handleBack}>← Back</button>
                <h1>Channels</h1>
                <button className="create-button" onClick={handleCreateChannelClick}>
                    Create New Channel
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {isCreatingChannel && (
                <div className="create-channel-form">
                    <input
                        type="text"
                        placeholder="Enter channel name"
                        value={newChannelName}
                        onChange={handleNewChannelNameChange}
                    />
                    <button onClick={handleCreateChannelSubmit}>Create</button>
                </div>
            )}

            <div className="channels-list">
                <h2>Your Channels</h2>
                {channels.length > 0 ? (
                    <div className="channel-grid">
                        {channels.map((channel) => (
                            <div
                                key={channel._id}
                                className="channel-item"
                                onClick={() => handleChannelClick(channel._id)}
                            >
                                <h3>{channel.name}</h3>
                                <span>{channel.members?.length || 0} members</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-channels">You haven't joined any channels yet.</p>
                )}
            </div>
        </Container>
    );
};

const Container = styled.div`
    padding: 2rem;
    height: 100vh;
    background-color: #f2f4f8;

    .channel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;

        h1 {
            color: #1f2937;
            margin: 0;
        }

        button {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .back-button {
            background-color: #e2e8f0;
            &:hover {
                background-color: #cbd5e1;
            }
        }

        .create-button {
            background-color: #4f46e5;
            color: white;
            &:hover {
                background-color: #4338ca;
            }
        }
    }

    .error-message {
        color: #ef4444;
        margin: 1rem 0;
        padding: 0.5rem;
        background-color: #fee2e2;
        border-radius: 0.5rem;
    }

    .create-channel-form {
        margin: 1rem 0;
        display: flex;
        gap: 1rem;

        input {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            &:focus {
                outline: none;
                border-color: #4f46e5;
            }
        }

        button {
            padding: 0.5rem 1rem;
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            &:hover {
                background-color: #4338ca;
            }
        }
    }

    .channels-list {
        margin-top: 2rem;

        h2 {
            color: #374151;
            margin-bottom: 1rem;
        }

        .channel-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;

            .channel-item {
                background: white;
                padding: 1rem;
                border-radius: 0.5rem;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                h3 {
                    margin: 0;
                    color: #1f2937;
                }

                span {
                    color: #6b7280;
                    font-size: 0.875rem;
                }
            }
        }

        .no-channels {
            color: #6b7280;
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 0.5rem;
        }
    }
`;

export default Channel;
