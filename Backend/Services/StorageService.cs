using Backend.Services.Interfaces;
using Supabase;
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;

namespace Backend.Services;

public class StorageService : IStorageService
{
    private readonly Client _supabaseClient;
    private readonly string _supabaseUrl;
    private readonly string _supabaseKey;
    private readonly IHttpClientFactory _httpClientFactory;

    public StorageService(Client supabaseClient, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _supabaseClient = supabaseClient;
        _supabaseUrl = configuration["Supabase:Url"] ?? throw new ArgumentNullException("Supabase:Url is missing");
        _supabaseKey = configuration["Supabase:Key"] ?? throw new ArgumentNullException("Supabase:Key is missing");
        _httpClientFactory = httpClientFactory;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string bucketName, string folderPath = "")
    {
        var fileExtension = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var fullPath = string.IsNullOrEmpty(folderPath) ? fileName : $"{folderPath}/{fileName}";

        // Para archivos grandes usamos HttpClient directo a la API REST de Supabase
        // para evitar el límite interno de la librería Supabase .NET
        var uploadUrl = $"{_supabaseUrl}/storage/v1/object/{bucketName}/{fullPath}";

        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_supabaseKey}");
        httpClient.DefaultRequestHeaders.Add("x-upsert", "true");

        using var streamContent = new StreamContent(file.OpenReadStream());
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);

        var response = await httpClient.PostAsync(uploadUrl, streamContent);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Supabase upload failed [{(int)response.StatusCode}]: {error}");
        }

        var publicUrl = _supabaseClient.Storage.From(bucketName).GetPublicUrl(fullPath);
        return publicUrl;
    }
}
