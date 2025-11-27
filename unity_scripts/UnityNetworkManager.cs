using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class UnityNetworkManager : MonoBehaviour
{
    // CAMBIAR ESTO por la URL de tu servidor (ej. http://localhost:4000 o tu IP si pruebas desde móvil)
    private const string BASE_URL = "http://localhost:4000";

    // Singleton para acceder fácil desde otros scripts
    public static UnityNetworkManager Instance;

    private string _authToken;
    public UserProfile CurrentUser;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    // --- Clases de Datos (DTOs) ---

    [Serializable]
    public class LoginPayload
    {
        public string identifier; // email o username
        public string password;
    }

    [Serializable]
    public class LoginResponse
    {
        public string status; // "OK" o "2FA_REQUIRED"
        public string token;
        public string error;  // En caso de error
    }

    [Serializable]
    public class UserProfile
    {
        public string id;
        public string nombres;
        public string apellidos;
        public string email;
        public string username;
        public string rol;
        public bool activo;
        public string fecha_nacimiento;
        public string genero;
    }

    // --- Métodos Públicos ---

    public void AttemptLogin(string username, string password, Action<bool, string> callback)
    {
        StartCoroutine(LoginCoroutine(username, password, callback));
    }

    public void FetchUserProfile(Action<bool, UserProfile> callback)
    {
        StartCoroutine(GetProfileCoroutine(callback));
    }

    // --- Corrutinas ---

    private IEnumerator LoginCoroutine(string username, string password, Action<bool, string> callback)
    {
        string url = BASE_URL + "/auth/login-password";

        LoginPayload payload = new LoginPayload { identifier = username, password = password };
        string json = JsonUtility.ToJson(payload);

        using (UnityWebRequest www = new UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
            www.uploadHandler = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");

            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error Login: " + www.error);
                callback(false, www.error);
            }
            else
            {
                string responseText = www.downloadHandler.text;
                Debug.Log("Login Response: " + responseText);

                try
                {
                    LoginResponse resp = JsonUtility.FromJson<LoginResponse>(responseText);
                    
                    if (resp.status == "OK")
                    {
                        _authToken = resp.token;
                        // Guardar token si quieres persistencia
                        // PlayerPrefs.SetString("auth_token", _authToken);
                        callback(true, "Login Exitoso");
                    }
                    else if (resp.status == "2FA_REQUIRED")
                    {
                        callback(false, "Se requiere 2FA (No implementado en Unity aún)");
                    }
                    else
                    {
                        callback(false, resp.error ?? "Error desconocido");
                    }
                }
                catch (Exception e)
                {
                    callback(false, "Error parseando respuesta: " + e.Message);
                }
            }
        }
    }

    private IEnumerator GetProfileCoroutine(Action<bool, UserProfile> callback)
    {
        if (string.IsNullOrEmpty(_authToken))
        {
            Debug.LogError("No hay token. Debes loguearte primero.");
            callback(false, null);
            yield break;
        }

        string url = BASE_URL + "/me";

        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            www.SetRequestHeader("Authorization", "Bearer " + _authToken);

            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error Profile: " + www.error);
                callback(false, null);
            }
            else
            {
                string responseText = www.downloadHandler.text;
                Debug.Log("Profile Response: " + responseText);

                try
                {
                    UserProfile profile = JsonUtility.FromJson<UserProfile>(responseText);
                    CurrentUser = profile;
                    callback(true, profile);
                }
                catch (Exception e)
                {
                    callback(false, null);
                }
            }
        }
    }
}
