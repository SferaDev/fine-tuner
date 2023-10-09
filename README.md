# fine-tuner

A small framework to build, train and deploy fine-tuned OpenAI models.

## Create a chat session

You can create a chat session by running:

```bash
$ fine-tuner chat
```

The session will be stored in `sessions/timestamp.json` and will look like this:

```json
{
  "messages": []
}
```

You can manually edit the sessions to add messages or change the system messages.

## Create a fine-tuned model

The stored sessions can be used to create a fine-tuned model by running:

```bash
$ fine-tuner deploy
```

If the model was deployed previously, it will be updated instead.

## Refresh sessions

If you want to refresh the sessions, you can run:

```bash
$ fine-tuner refresh
```

All function calls will be executed again and the assisant will be trained with the new data.

This is useful if you want to change a function or update the system messages.

## Configuration

The configuration is stored in `config.json` and looks like this:

```json
{
  "model": "gpt-3.5-turbo",
  "id": "fine-tune-model-id",
  "system_messages": []
}
```
